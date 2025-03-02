import { expectLogic } from 'kea-test-utils'
import { MOCK_DEFAULT_TEAM } from 'lib/api.mock'
import { insightLogic } from 'scenes/insights/insightLogic'
import { useMocks } from '~/mocks/jest'
import { annotationsModel, deserializeAnnotation } from '~/models/annotationsModel'
import { initKeaTests } from '~/test/init'
import { AnnotationScope, RawAnnotationType, InsightShortId, IntervalType, AnnotationType } from '~/types'
import { annotationsOverlayLogic } from './annotationsOverlayLogic'

jest.spyOn(Storage.prototype, 'getItem')

const MOCK_INSIGHT_SHORT_ID = 'abcdef' as InsightShortId
const MOCK_INSIGHT_NUMERIC_ID = 1

const BASE_MOCK_ANNOTATION = {
    creation_type: 'USR',
    created_by: {
        id: 5,
        uuid: '0182cb27-8dfc-0000-1f45-c16dc0de95ea',
        distinct_id: 'XoBG3ygtKV8635pAFkEWHKboT6me1MTVaJETde7dm8V',
        first_name: 'Employee 427',
        email: 'michael@posthog.com',
    },
    created_at: '2022-08-26T12:06:00.892304Z',
    updated_at: '2022-08-29T11:21:25.022540Z',
    deleted: false,
}

/** ID 20 at 2022-08-10T04:00:00.000Z */
const MOCK_ANNOTATION_ORG_SCOPED: RawAnnotationType = {
    id: 20,
    content: 'Alpha',
    date_marker: '2022-08-10T04:00:00.000Z',
    dashboard_item: null,
    insight_short_id: null,
    insight_name: null,
    scope: AnnotationScope.Organization,
    ...BASE_MOCK_ANNOTATION,
}
/** ID 10 at 2022-08-10T04:00:01.000Z */
const MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3: RawAnnotationType = {
    id: 10,
    content: 'Alpha',
    date_marker: '2022-08-10T04:00:01.000Z', // A second after MOCK_ANNOTATION_ORG_SCOPED
    dashboard_item: 3,
    insight_short_id: 'xxxxxx' as InsightShortId,
    insight_name: 'Clicks',
    scope: AnnotationScope.Organization,
    ...BASE_MOCK_ANNOTATION,
}
/** ID 17 at 2022-08-10T04:01:00.000Z */
const MOCK_ANNOTATION_PROJECT_SCOPED: RawAnnotationType = {
    id: 17,
    content: 'Beta',
    date_marker: '2022-08-10T04:01:00.000Z', // A minute after MOCK_ANNOTATION_ORG_SCOPED
    dashboard_item: null,
    insight_short_id: null,
    insight_name: null,
    scope: AnnotationScope.Project,
    ...BASE_MOCK_ANNOTATION,
}
/** ID 19 at 2022-08-10T05:00:00.000Z */
const MOCK_ANNOTATION_INSIGHT_1_SCOPED: RawAnnotationType = {
    id: 19,
    content: 'Theta',
    date_marker: '2022-08-10T05:00:00.000Z', // An hour after MOCK_ANNOTATION_ORG_SCOPED
    dashboard_item: 1,
    insight_short_id: MOCK_INSIGHT_SHORT_ID,
    insight_name: 'Pageviews',
    scope: AnnotationScope.Insight,
    ...BASE_MOCK_ANNOTATION,
}
/** ID 20 at 2022-08-11T04:00:00.000Z */
const MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1: RawAnnotationType = {
    id: 20,
    content: 'Theta',
    date_marker: '2022-08-11T04:00:00.000Z', // A day after MOCK_ANNOTATION_ORG_SCOPED
    dashboard_item: MOCK_INSIGHT_NUMERIC_ID,
    insight_short_id: MOCK_INSIGHT_SHORT_ID,
    insight_name: 'Pageviews',
    scope: AnnotationScope.Project,
    ...BASE_MOCK_ANNOTATION,
}
/** ID 21 at 2022-08-17T04:00:00.000Z */
const MOCK_ANNOTATION_INSIGHT_3_SCOPED: RawAnnotationType = {
    id: 21,
    content: 'Omega',
    date_marker: '2022-08-17T04:00:00.000Z', // A week after MOCK_ANNOTATION_ORG_SCOPED
    dashboard_item: 3,
    insight_short_id: 'xxxxxx' as InsightShortId,
    insight_name: 'Clicks',
    scope: AnnotationScope.Insight,
    ...BASE_MOCK_ANNOTATION,
}
/** ID 40 at 2022-08-17T04:00:00.000Z */
const MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1: RawAnnotationType = {
    id: 40,
    content: 'Alpha',
    date_marker: '2022-08-17T04:00:00.000Z', // A week after MOCK_ANNOTATION_ORG_SCOPED
    dashboard_item: MOCK_INSIGHT_NUMERIC_ID,
    insight_short_id: MOCK_INSIGHT_SHORT_ID,
    insight_name: 'Pageviews',
    scope: AnnotationScope.Organization,
    ...BASE_MOCK_ANNOTATION,
}
/** ID 22 at 2022-09-10T04:00:00.000Z */
const MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3: RawAnnotationType = {
    id: 22,
    content: 'Omega',
    date_marker: '2022-09-10T04:00:00.000Z', // A month after MOCK_ANNOTATION_ORG_SCOPED
    dashboard_item: 3,
    insight_short_id: 'xxxxxx' as InsightShortId,
    insight_name: 'Clicks',
    scope: AnnotationScope.Project,
    ...BASE_MOCK_ANNOTATION,
}

function useInsightMocks(interval: string = 'day', timezone: string = 'UTC'): void {
    const insight = {
        result: {},
        id: MOCK_INSIGHT_NUMERIC_ID,
        short_id: MOCK_INSIGHT_SHORT_ID,
        filters: {
            interval,
        },
        timezone,
    }
    useMocks({
        get: {
            '/api/projects/:team_id/insights/': () => {
                return [
                    200,
                    {
                        results: [insight],
                    },
                ]
            },
            [`/api/projects/:team_id/insights/${MOCK_INSIGHT_NUMERIC_ID}`]: () => {
                return [200, insight]
            },
        },
    })
}

function useAnnotationsMocks(): void {
    useMocks({
        get: {
            '/api/projects/:team_id/annotations/': {
                results: [
                    MOCK_ANNOTATION_ORG_SCOPED,
                    MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                    MOCK_ANNOTATION_PROJECT_SCOPED,
                    MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                    MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                    MOCK_ANNOTATION_INSIGHT_3_SCOPED,
                    MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1,
                    MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3,
                ],
            },
        },
    })
}

describe('annotationsOverlayLogic', () => {
    let logic: ReturnType<typeof annotationsOverlayLogic.build>

    beforeEach(() => {
        useAnnotationsMocks()
    })

    afterEach(() => {
        logic.unmount()
    })

    it('loads annotations on mount', async () => {
        initKeaTests()

        useInsightMocks()

        logic = annotationsOverlayLogic({
            dashboardItemId: MOCK_INSIGHT_SHORT_ID,
            insightNumericId: MOCK_INSIGHT_NUMERIC_ID,
        })
        logic.mount()
        await expectLogic(annotationsModel).toDispatchActions(['loadAnnotations'])
    })

    describe('relevantAnnotations', () => {
        initKeaTests()

        it('returns annotations scoped to the insight for a saved insight', async () => {
            useInsightMocks()

            logic = annotationsOverlayLogic({
                dashboardItemId: MOCK_INSIGHT_SHORT_ID,
                insightNumericId: MOCK_INSIGHT_NUMERIC_ID,
            })
            logic.mount()
            await expectLogic(annotationsModel).toDispatchActions(['loadAnnotationsSuccess'])
            await expectLogic(insightLogic({ dashboardItemId: MOCK_INSIGHT_SHORT_ID })).toDispatchActions([
                'loadInsightSuccess',
            ])
            await expectLogic(logic).toMatchValues({
                relevantAnnotations: [
                    // The annotation scoped to insight 3 should be omitted
                    MOCK_ANNOTATION_ORG_SCOPED,
                    MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                    MOCK_ANNOTATION_PROJECT_SCOPED,
                    MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                    MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                    MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1,
                    MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3,
                ].map((annotation) => deserializeAnnotation(annotation, 'UTC')),
            })
        })

        it('returns annotations scoped to the project for a new insight', async () => {
            initKeaTests()

            useInsightMocks()

            logic = annotationsOverlayLogic({ dashboardItemId: 'new', insightNumericId: 'new' })
            logic.mount()
            await expectLogic(annotationsModel).toDispatchActions(['loadAnnotationsSuccess'])
            await expectLogic(insightLogic({ dashboardItemId: MOCK_INSIGHT_SHORT_ID })).toDispatchActions([
                'loadInsightSuccess',
            ])
            await expectLogic(logic).toMatchValues({
                relevantAnnotations: [
                    // The annotation scoped to insight 3 should be omitted
                    MOCK_ANNOTATION_ORG_SCOPED,
                    MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                    MOCK_ANNOTATION_PROJECT_SCOPED,
                    MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                    MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1,
                    MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3,
                ].map((annotation) => deserializeAnnotation(annotation, 'UTC')),
            })
        })
    })

    describe('groupedAnnotations', () => {
        const EXPECTED_GROUPINGS_BY_INTERVAL_AND_TIMEZONE: Record<
            string,
            Record<IntervalType, Record<string, AnnotationType[]>> // All IntervalType variants should be covered
        > = {
            UTC: {
                hour: {
                    '2022-08-10 04': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                    ].map((annotation) => deserializeAnnotation(annotation, 'UTC')),
                    '2022-08-10 05': [MOCK_ANNOTATION_INSIGHT_1_SCOPED].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                    '2022-08-11 04': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                    '2022-08-17 04': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                    '2022-09-10 04': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                },
                day: {
                    '2022-08-10': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                    ].map((annotation) => deserializeAnnotation(annotation, 'UTC')),
                    '2022-08-11': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                    '2022-08-17': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                    '2022-09-10': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                },
                week: {
                    '2022-08-07': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                        MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                    ].map((annotation) => deserializeAnnotation(annotation, 'UTC')),
                    '2022-08-14': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                    '2022-09-04': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                },
                month: {
                    '2022-08': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                        MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1,
                    ].map((annotation) => deserializeAnnotation(annotation, 'UTC')),
                    '2022-09': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'UTC')
                    ),
                },
            },
            'America/Phoenix': {
                // Purposefully using Phoenix for test determinism - Arizona does NOT observe DST
                hour: {
                    '2022-08-09 21': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                    ].map((annotation) => deserializeAnnotation(annotation, 'America/Phoenix')),
                    '2022-08-09 22': [MOCK_ANNOTATION_INSIGHT_1_SCOPED].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                    '2022-08-10 21': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                    '2022-08-16 21': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                    '2022-09-09 21': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                },
                day: {
                    '2022-08-09': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                    ].map((annotation) => deserializeAnnotation(annotation, 'America/Phoenix')),
                    '2022-08-10': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                    '2022-08-16': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                    '2022-09-09': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                },
                week: {
                    '2022-08-07': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                        MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                    ].map((annotation) => deserializeAnnotation(annotation, 'America/Phoenix')),
                    '2022-08-14': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                    '2022-09-04': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                },
                month: {
                    '2022-08': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                        MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1,
                    ].map((annotation) => deserializeAnnotation(annotation, 'America/Phoenix')),
                    '2022-09': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'America/Phoenix')
                    ),
                },
            },
            'Europe/Moscow': {
                // Purposefully using Moscow for test determinism - Russia does NOT observe DST
                hour: {
                    '2022-08-10 07': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                    ].map((annotation) => deserializeAnnotation(annotation, 'Europe/Moscow')),
                    '2022-08-10 08': [MOCK_ANNOTATION_INSIGHT_1_SCOPED].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                    '2022-08-11 07': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                    '2022-08-17 07': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                    '2022-09-10 07': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                },
                day: {
                    '2022-08-10': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                    ].map((annotation) => deserializeAnnotation(annotation, 'Europe/Moscow')),
                    '2022-08-11': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                    '2022-08-17': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                    '2022-09-10': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                },
                week: {
                    '2022-08-07': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                        MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                    ].map((annotation) => deserializeAnnotation(annotation, 'Europe/Moscow')),
                    '2022-08-14': [MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                    '2022-09-04': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                },
                month: {
                    '2022-08': [
                        MOCK_ANNOTATION_ORG_SCOPED,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_3,
                        MOCK_ANNOTATION_PROJECT_SCOPED,
                        MOCK_ANNOTATION_INSIGHT_1_SCOPED,
                        MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_1,
                        MOCK_ANNOTATION_ORG_SCOPED_FROM_INSIGHT_1,
                    ].map((annotation) => deserializeAnnotation(annotation, 'Europe/Moscow')),
                    '2022-09': [MOCK_ANNOTATION_PROJECT_SCOPED_FROM_INSIGHT_3].map((annotation) =>
                        deserializeAnnotation(annotation, 'Europe/Moscow')
                    ),
                },
            },
        }

        for (const [timezone, intervalAndExpectedGroupings] of Object.entries(
            EXPECTED_GROUPINGS_BY_INTERVAL_AND_TIMEZONE
        )) {
            for (const [interval, expectedGrouping] of Object.entries(intervalAndExpectedGroupings)) {
                it(`groups correctly by ${interval} with ${timezone} as insight timezone`, async () => {
                    initKeaTests(true, { ...MOCK_DEFAULT_TEAM, timezone })

                    useInsightMocks(interval, timezone)

                    logic = annotationsOverlayLogic({
                        dashboardItemId: MOCK_INSIGHT_SHORT_ID,
                        insightNumericId: MOCK_INSIGHT_NUMERIC_ID,
                    })
                    logic.mount()
                    await expectLogic(annotationsModel).toDispatchActions(['loadAnnotationsSuccess'])
                    await expectLogic(insightLogic({ dashboardItemId: MOCK_INSIGHT_SHORT_ID })).toDispatchActions([
                        'loadInsightSuccess',
                    ])
                    await expectLogic(logic).toMatchValues({
                        groupedAnnotations: expectedGrouping,
                    })
                })
            }
        }
    })
})

import React, { useEffect } from 'react'
import { BindLogic, useActions, useValues } from 'kea'
import { dashboardLogic, DashboardLogicProps } from 'scenes/dashboard/dashboardLogic'
import { DashboardItems } from 'scenes/dashboard/DashboardItems'
import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { CalendarOutlined } from '@ant-design/icons'
import './Dashboard.scss'
import { useKeyboardHotkeys } from 'lib/hooks/useKeyboardHotkeys'
import { DashboardMode, DashboardPlacement, DashboardType } from '~/types'
import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import { TZIndicator } from 'lib/components/TimezoneAware'
import { EmptyDashboardComponent } from './EmptyDashboardComponent'
import { NotFound } from 'lib/components/NotFound'
import { DashboardReloadAction, LastRefreshText } from 'scenes/dashboard/DashboardReloadAction'
import { SceneExport } from 'scenes/sceneTypes'
import { InsightErrorState } from 'scenes/insights/EmptyStates'
import { DashboardHeader } from './DashboardHeader'
import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { LemonDivider } from '@posthog/lemon-ui'

interface Props {
    id?: string
    dashboard?: DashboardType
    placement?: DashboardPlacement
}

export const scene: SceneExport = {
    component: DashboardScene,
    logic: dashboardLogic,
    paramsToProps: ({ params: { id, placement } }: { params: Props }): DashboardLogicProps => ({
        id: id ? parseInt(id) : undefined,
        placement,
    }),
}

export function Dashboard({ id, dashboard, placement }: Props = {}): JSX.Element {
    return (
        <BindLogic logic={dashboardLogic} props={{ id: id ? parseInt(id) : undefined, placement, dashboard }}>
            <DashboardScene />
        </BindLogic>
    )
}

function DashboardScene(): JSX.Element {
    const {
        placement,
        dashboard,
        canEditDashboard,
        items,
        itemsLoading,
        filters: dashboardFilters,
        dashboardMode,
        receivedErrorsFromAPI,
    } = useValues(dashboardLogic)
    const { setDashboardMode, setDates, reportDashboardViewed, setProperties } = useActions(dashboardLogic)

    useEffect(() => {
        reportDashboardViewed()
    }, [])

    useKeyboardHotkeys(
        placement == DashboardPlacement.Dashboard
            ? {
                  e: {
                      action: () =>
                          setDashboardMode(
                              dashboardMode === DashboardMode.Edit ? null : DashboardMode.Edit,
                              DashboardEventSource.Hotkey
                          ),
                      disabled: !canEditDashboard || (dashboardMode !== null && dashboardMode !== DashboardMode.Edit),
                  },
                  f: {
                      action: () =>
                          setDashboardMode(
                              dashboardMode === DashboardMode.Fullscreen ? null : DashboardMode.Fullscreen,
                              DashboardEventSource.Hotkey
                          ),
                      disabled: dashboardMode !== null && dashboardMode !== DashboardMode.Fullscreen,
                  },
                  escape: {
                      // Exit edit mode with Esc. Full screen mode is also exited with Esc, but this behavior is native to the browser.
                      action: () => setDashboardMode(null, DashboardEventSource.Hotkey),
                      disabled: dashboardMode !== DashboardMode.Edit,
                  },
              }
            : {},
        [setDashboardMode, dashboardMode, placement]
    )

    if (!dashboard && !itemsLoading && receivedErrorsFromAPI) {
        return <NotFound object="dashboard" />
    }

    return (
        <div className="dashboard">
            {placement == DashboardPlacement.Dashboard && <DashboardHeader />}

            {receivedErrorsFromAPI ? (
                <InsightErrorState title="There was an error loading this dashboard" />
            ) : !items || items.length === 0 ? (
                <EmptyDashboardComponent loading={itemsLoading} />
            ) : (
                <div>
                    {![
                        DashboardPlacement.Public,
                        DashboardPlacement.Export,
                        DashboardPlacement.InternalMetrics,
                    ].includes(placement) && (
                        <>
                            <div className="flex space-x-4">
                                <div className="flex items-center" style={{ height: '2rem' }}>
                                    <TZIndicator style={{ marginRight: '0.5rem' }} />
                                    <DateFilter
                                        showCustom
                                        dateFrom={dashboardFilters?.date_from ?? undefined}
                                        dateTo={dashboardFilters?.date_to ?? undefined}
                                        onChange={setDates}
                                        disabled={!canEditDashboard}
                                        makeLabel={(key) => (
                                            <>
                                                <CalendarOutlined />
                                                <span className="hide-when-small"> {key}</span>
                                            </>
                                        )}
                                    />
                                </div>
                                <PropertyFilters
                                    onChange={setProperties}
                                    pageKey={'dashboard_' + dashboard?.id}
                                    propertyFilters={dashboard?.filters.properties}
                                />
                            </div>
                            <LemonDivider className="my-4" />
                        </>
                    )}
                    {placement !== DashboardPlacement.Export && (
                        <div className="flex pb-4 space-x-4 dashoard-items-actions">
                            <div
                                className="left-item"
                                style={placement === DashboardPlacement.Public ? { textAlign: 'right' } : undefined}
                            >
                                {[DashboardPlacement.Public, DashboardPlacement.InternalMetrics].includes(placement) ? (
                                    <LastRefreshText />
                                ) : (
                                    <DashboardReloadAction />
                                )}
                            </div>
                        </div>
                    )}
                    <DashboardItems />
                </div>
            )}
        </div>
    )
}

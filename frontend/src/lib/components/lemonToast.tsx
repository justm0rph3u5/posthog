import React from 'react'
import { toast, ToastContentProps as ToastifyRenderProps, ToastOptions } from 'react-toastify'
import { IconCheckmark, IconClose, IconErrorOutline, IconInfo, IconWarning } from './icons'
import { LemonButton } from './LemonButton'
import { Spinner } from 'lib/components/Spinner/Spinner'

export function ToastCloseButton({ closeToast }: { closeToast?: () => void }): JSX.Element {
    return <LemonButton type="tertiary" icon={<IconClose />} onClick={closeToast} data-attr="toast-close-button" />
}

interface ToastButton {
    label: string
    action: () => void
    dataAttr?: string
}

interface ToastOptionsWithButton extends ToastOptions {
    button?: ToastButton
}

export const GET_HELP_BUTTON: ToastButton = {
    label: 'Get help',
    action: () => {
        window.open('https://posthog.com/support?utm_medium=in-product&utm_campaign=error-toast', '_blank')
    },
}

export interface ToastContentProps {
    type: 'info' | 'success' | 'warning' | 'error'
    message: string | JSX.Element
    button?: ToastButton
    id?: number | string
}

export function ToastContent({ type, message, button, id }: ToastContentProps): JSX.Element {
    return (
        <div className="flex items-center" data-attr={`${type}-toast`}>
            <span className="grow">{message}</span>
            {button && (
                <LemonButton
                    onClick={() => {
                        button.action()
                        toast.dismiss(id)
                    }}
                    type="secondary"
                    size="small"
                    data-attr={button.dataAttr}
                >
                    {button.label}
                </LemonButton>
            )}
        </div>
    )
}

function ensureToastId(toastOptions: ToastOptions): ToastOptions {
    return toastOptions.toastId
        ? toastOptions
        : { ...toastOptions, toastId: `lemon-${Math.round(Math.random() * 10000000)}` }
}

export const lemonToast = {
    info(message: string | JSX.Element, { button, ...toastOptions }: ToastOptionsWithButton = {}): void {
        toastOptions = ensureToastId(toastOptions)
        toast.info(<ToastContent type="info" message={message} button={button} id={toastOptions.toastId} />, {
            icon: <IconInfo />,
            ...toastOptions,
        })
    },
    success(message: string | JSX.Element, { button, ...toastOptions }: ToastOptionsWithButton = {}): void {
        toastOptions = ensureToastId(toastOptions)
        toast.success(<ToastContent type="success" message={message} button={button} id={toastOptions.toastId} />, {
            icon: <IconCheckmark />,
            ...toastOptions,
        })
    },
    warning(message: string | JSX.Element, { button, ...toastOptions }: ToastOptionsWithButton = {}): void {
        toastOptions = ensureToastId(toastOptions)
        toast.warning(<ToastContent type="warning" message={message} button={button} id={toastOptions.toastId} />, {
            icon: <IconWarning />,
            ...toastOptions,
        })
    },
    error(message: string | JSX.Element, { button, ...toastOptions }: ToastOptionsWithButton = {}): void {
        toastOptions = ensureToastId(toastOptions)
        toast.error(
            <ToastContent
                type="error"
                message={message}
                button={button || GET_HELP_BUTTON}
                id={toastOptions.toastId}
            />,
            {
                icon: <IconErrorOutline />,
                ...toastOptions,
            }
        )
    },
    promise(
        promise: Promise<any>,
        messages: { pending: string | JSX.Element; success: string | JSX.Element; error: string | JSX.Element },
        icons: { pending?: JSX.Element; success?: JSX.Element; error?: JSX.Element } = {},
        { button, ...toastOptions }: ToastOptionsWithButton = {}
    ): Promise<any> {
        toastOptions = ensureToastId(toastOptions)
        // see https://fkhadra.github.io/react-toastify/promise
        return toast.promise(
            promise,
            {
                pending: {
                    render: <ToastContent type={'info'} message={messages.pending} />,
                    icon: icons.pending ?? <Spinner />,
                },
                success: {
                    render({ data }: ToastifyRenderProps<string>) {
                        return <ToastContent type={'success'} message={data || messages.success} />
                    },
                    icon: icons.success ?? <IconCheckmark />,
                },
                error: {
                    render({ data }: ToastifyRenderProps<Error>) {
                        return <ToastContent type={'error'} message={data?.message || messages.error} />
                    },
                    icon: icons.error ?? <IconErrorOutline />,
                },
            },
            toastOptions
        )
    },
    dismiss(id?: number | string): void {
        toast.dismiss(id)
    },
}

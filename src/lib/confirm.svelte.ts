type State = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolver: ((v: boolean) => void) | null;
};

export const confirmState = $state<State>({
  open: false,
  title: "",
  message: "",
  confirmLabel: "Delete",
  danger: true,
  resolver: null,
});

type Opts = { confirmLabel?: string; danger?: boolean };

export function openConfirm(
  title: string,
  message: string,
  opts: Opts = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.title = title;
    confirmState.message = message;
    confirmState.confirmLabel = opts.confirmLabel ?? "Delete";
    confirmState.danger = opts.danger ?? true;
    confirmState.resolver = resolve;
    confirmState.open = true;
  });
}

export function resolveConfirm(v: boolean) {
  const { resolver } = confirmState;
  confirmState.open = false;
  confirmState.resolver = null;
  resolver?.(v);
}

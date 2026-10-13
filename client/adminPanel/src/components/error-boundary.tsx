import { AlertOctagonIcon, RotateCcwIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  /** Changing this value resets the boundary — used to reset on navigation. */
  resetKey?: string;
  label?: string;
};

type State = { error: Error | null };

/**
 * Keeps one failing screen from blanking the whole console. Renders a recovery
 * panel instead, with a retry that clears the error and remounts the subtree.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error) {
    console.error("[admin-panel] render error", error);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
          <AlertOctagonIcon className="size-5" />
        </div>
        <div className="max-w-md space-y-1">
          <p className="font-medium">
            {this.props.label ?? "This screen failed to render"}
          </p>
          <p className="text-muted-foreground text-sm break-words">
            {error.message}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload console
          </Button>
          <Button onClick={this.reset}>
            <RotateCcwIcon className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }
}

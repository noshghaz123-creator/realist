import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
            <p className="text-slate-500 mt-2 text-sm">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import PromptDialog from '../components/ui/PromptDialog.jsx';

const DialogContext = createContext(null);

export function ConfirmProvider({ children }) {
  const queue = useRef([]);
  const [activeDialog, setActiveDialog] = useState(null);

  const enqueue = useCallback((request) => {
    if (queue.current.length === 0) setActiveDialog(request);
    queue.current.push(request);
  }, []);

  const complete = useCallback((result) => {
    const current = queue.current.shift();
    if (!current) return;
    current.resolve(result);
    setActiveDialog(queue.current[0] ?? null);
  }, []);

  const cancel = useCallback(() => {
    const current = queue.current[0];
    complete(current?.type === 'prompt' ? null : false);
  }, [complete]);

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    enqueue({ ...options, type: 'confirm', resolve });
  }), [enqueue]);

  const prompt = useCallback((options = {}) => new Promise((resolve) => {
    enqueue({ ...options, type: 'prompt', resolve });
  }), [enqueue]);

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {activeDialog?.type === 'confirm' && (
        <ConfirmDialog
          {...activeDialog}
          onConfirm={() => complete(true)}
          onCancel={cancel}
        />
      )}
      {activeDialog?.type === 'prompt' && (
        <PromptDialog
          {...activeDialog}
          onConfirm={(value) => complete(value)}
          onCancel={cancel}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context.confirm;
}

export function usePrompt() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('usePrompt must be used within a ConfirmProvider');
  return context.prompt;
}

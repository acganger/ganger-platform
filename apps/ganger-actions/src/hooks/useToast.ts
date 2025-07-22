import { useToast as useUIToast } from '@ganger/ui-catalyst';

export function useToast() {
  const { addToast } = useUIToast();

  const toast = (options: {
    title?: string;
    description: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  }) => {
    addToast({
      type: options.variant || 'info',
      title: options.title,
      message: options.description,
    });
  };

  return { toast };
}

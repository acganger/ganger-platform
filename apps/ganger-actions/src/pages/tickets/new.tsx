import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NewTicketRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to forms page
    router.replace('/forms');
  }, [router]);

  return null;
}

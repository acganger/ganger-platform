import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard'); // Redirect to the main dashboard of ganger-actions
  }, [router]);

  return null; // Or a loading spinner if needed
}

export async function getServerSideProps() {
  return { props: {} };
}

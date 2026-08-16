import '@/styles/globals.css';
import "@/styles/user.css";
import "@/styles/utility.css";
import "@/styles/elora.css";
import type { AppProps } from 'next/app';
import StockwiseLayout from '@/components/Stockwise/Layout';
import LetterlockLayout from '@/components/Letterlock/Layout';
import EloraLayout from '@/components/Elora/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (router.pathname.startsWith('/login')) {
      return
    }

    const checkLoggedIn = async (): Promise<void> => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        router.push('/login');
      } else {
        setLoggedIn(true);
      }
    }

    checkLoggedIn();
  }, [router.pathname]);
  
  if (loggedIn) {
    if (router.pathname.startsWith('/stockwise')) {
      return (
        <StockwiseLayout>
          <Component {...pageProps} />
        </StockwiseLayout>
      );
    } else if (router.pathname.startsWith('/letterlock')) {
      return (
        <LetterlockLayout>
          <Component {...pageProps} />
        </LetterlockLayout>
      );
    } else if (router.pathname.startsWith('/elora')) {
      return (
        <EloraLayout>
          <Component {...pageProps} />
        </EloraLayout>
      );
    }

    return <Component {...pageProps} />;
  } else if (router.pathname.startsWith('/login')) {
    return <Component {...pageProps} />;
  }
}

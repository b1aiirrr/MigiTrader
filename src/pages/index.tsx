import Head from 'next/head';
import DailyAlphaDashboard from '../components/DailyAlphaDashboard';

export default function Home() {
    return (
        <>
            <Head>
                <title>MigiTrader - NSE Daily Alpha Engine</title>
                <meta name="description" content="High-performance PWA for NSE Kenya trading insights. Execute trades via Ziidi on M-Pesa." />
                <meta property="og:title" content="MigiTrader - NSE Daily Alpha" />
                <meta property="og:description" content="AI-powered stock picks for the Nairobi Securities Exchange" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <DailyAlphaDashboard />
        </>
    );
}

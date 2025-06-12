import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/shared/Layout';
import { AuthorizationWizard } from '@/components/wizard/AuthorizationWizard';

export default function CreateAuthorizationPage() {
  const router = useRouter();
  const { step } = router.query;

  return (
    <>
      <Head>
        <title>Create Authorization - Medication Authorization Assistant</title>
        <meta 
          name="description" 
          content="Create new medication authorization request with AI assistance" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                  Create New Authorization
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  AI-powered medication authorization wizard
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AuthorizationWizard initialStep={step as string} />
          </div>
        </div>
      </Layout>
    </>
  );
}
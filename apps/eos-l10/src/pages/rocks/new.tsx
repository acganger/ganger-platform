import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth, AuthGuard, TeamGuard } from '@/lib/auth-eos';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { Target, Calendar, User, FileText, TrendingUp, ArrowLeft } from 'lucide-react';
import SafeLink from '@/components/ui/SafeLink';

export default function NewRockPage() {
  const router = useRouter();
  const { activeTeam, user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quarter: '',
    owner_id: user?.id || '',
    due_date: '',
    priority: 1,
  });

  // Generate quarter options
  const generateQuarterOptions = () => {
    const currentYear = new Date().getFullYear();
    const quarters = [];
    
    for (let year = currentYear; year <= currentYear + 1; year++) {
      for (let q = 1; q <= 4; q++) {
        quarters.push(`Q${q} ${year}`);
      }
    }
    
    return quarters;
  };

  // Get current quarter as default
  const getCurrentQuarter = () => {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${quarter} ${year}`;
  };

  // Set default quarter if not set
  if (!formData.quarter) {
    setFormData(prev => ({ ...prev, quarter: getCurrentQuarter() }));
  }

  // Get default due date for quarter end
  const getQuarterEndDate = (quarterStr: string) => {
    const [q, year] = quarterStr.split(' ');
    const quarter = parseInt(q.replace('Q', ''));
    const yearNum = parseInt(year);
    
    const quarterEndMonth = quarter * 3;
    const lastDay = new Date(yearNum, quarterEndMonth, 0).getDate();
    
    return `${yearNum}-${quarterEndMonth.toString().padStart(2, '0')}-${lastDay}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeTeam || !user) return;
    
    setLoading(true);

    try {
      // Get the highest priority for the team and quarter
      const { data: existingRocks } = await supabase
        .from('rocks')
        .select('priority')
        .eq('team_id', activeTeam.id)
        .eq('quarter', formData.quarter)
        .order('priority', { ascending: false })
        .limit(1);

      const nextPriority = existingRocks && existingRocks.length > 0 
        ? existingRocks[0].priority + 1 
        : 1;

      const { data, error } = await supabase
        .from('rocks')
        .insert({
          team_id: activeTeam.id,
          title: formData.title,
          description: formData.description || null,
          quarter: formData.quarter,
          owner_id: formData.owner_id,
          due_date: formData.due_date,
          priority: nextPriority,
          status: 'not_started',
          completion_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/rocks/${data.id}`);
    } catch (error) {
      alert('Failed to create rock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (userRole === 'viewer') {
    return (
      <AuthGuard>
        <TeamGuard>
          <Layout>
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-500">
                You don't have permission to create rocks.
              </p>
              <SafeLink href="/rocks" className="btn-primary mt-4">
                Back to Rocks
              </SafeLink>
            </div>
          </Layout>
        </TeamGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <TeamGuard>
        <div>
          <Head>
            <title>New Rock - EOS L10 Platform</title>
            <meta name="description" content="Create a new quarterly rock" />
          </Head>

          <Layout>
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center space-x-4">
                <SafeLink
                  href="/rocks"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </SafeLink>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Target className="h-6 w-6 mr-2 text-eos-600" />
                    Create New Rock
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Set a quarterly goal for your team
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="card-header">
                    <h2 className="card-title">Rock Details</h2>
                    <p className="text-sm text-gray-600">
                      Define your quarterly goal with clear ownership and timeline
                    </p>
                  </div>

                  <div className="card-content space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="h-4 w-4 inline mr-1" />
                        Rock Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Launch new patient portal"
                        className="input"
                        maxLength={200}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Keep it specific and measurable ({formData.title.length}/200)
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        placeholder="Optional: Add more details about this rock..."
                        className="input"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Provide context and success criteria ({formData.description.length}/500)
                      </p>
                    </div>

                    {/* Quarter and Owner Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Quarter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Quarter *
                        </label>
                        <select
                          required
                          value={formData.quarter}
                          onChange={(e) => {
                            const newQuarter = e.target.value;
                            setFormData({ 
                              ...formData, 
                              quarter: newQuarter,
                              due_date: formData.due_date || getQuarterEndDate(newQuarter)
                            });
                          }}
                          className="input"
                        >
                          {generateQuarterOptions().map(quarter => (
                            <option key={quarter} value={quarter}>
                              {quarter}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Owner */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="h-4 w-4 inline mr-1" />
                          Rock Owner *
                        </label>
                        <select
                          required
                          value={formData.owner_id}
                          onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                          className="input"
                        >
                          <option value={user?.id || ''}>
                            Me ({user?.email || ''})
                          </option>
                          {/* TODO: Add team members when available */}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Who is accountable for this rock's completion?
                        </p>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        Due Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        When should this rock be completed?
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="card-footer">
                    <div className="flex items-center justify-between">
                      <SafeLink
                        href="/rocks"
                        className="btn-secondary"
                      >
                        Cancel
                      </SafeLink>
                      
                      <button
                        type="submit"
                        disabled={loading || !formData.title || !formData.quarter || !formData.owner_id || !formData.due_date}
                        className="btn-primary"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Target className="h-4 w-4 mr-2" />
                            Create Rock
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Rock Creation Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Make it specific and measurable</li>
                  <li>• Assign clear ownership to one person</li>
                  <li>• Set realistic but challenging goals</li>
                  <li>• Align with your team's quarterly priorities</li>
                </ul>
              </div>
            </div>
          </Layout>
        </div>
      </TeamGuard>
    </AuthGuard>
  );
}

// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}export const runtime = 'edge';

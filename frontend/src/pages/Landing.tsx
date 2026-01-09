import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Github,
  Shield,
  Zap,
  BarChart3,
  Code,
  GitPullRequest,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';

const features = [
  {
    icon: Shield,
    title: 'Security Analysis',
    description: 'Detect vulnerabilities, SQL injection, XSS, and sensitive data exposure.',
  },
  {
    icon: Zap,
    title: 'Performance Insights',
    description: 'Identify memory leaks, inefficient algorithms, and bottlenecks.',
  },
  {
    icon: Code,
    title: 'Code Quality',
    description: 'Check for complexity, duplication, naming conventions, and best practices.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track trends, improvements, and team metrics over time.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect GitHub',
    description: 'Authenticate with your GitHub account to access your repositories.',
  },
  {
    number: '02',
    title: 'Select Repository',
    description: 'Choose which repositories you want to enable AI-powered code reviews for.',
  },
  {
    number: '03',
    title: 'Get Reviews',
    description: 'AI analyzes your pull requests and provides detailed feedback instantly.',
  },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    window.location.href = authApi.getAuthUrl();
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-ocean-950/50 via-transparent to-coral-950/30 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500 to-coral-500 flex items-center justify-center shadow-glow">
                <GitPullRequest className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Code Review AI</span>
            </div>
            
            <Button onClick={handleLogin} leftIcon={<Github className="w-5 h-5" />}>
              Sign in with GitHub
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-900/50 border border-ocean-700/50 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse" />
            <span className="text-sm text-ocean-300">Powered by Claude AI</span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-white">AI-Powered</span>
            <br />
            <span className="text-gradient">Code Reviews</span>
          </h1>

          <p className="text-xl text-ocean-300 max-w-2xl mx-auto mb-10">
            Automatically analyze your GitHub pull requests for security vulnerabilities,
            performance issues, and code quality improvements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleLogin}
              size="lg"
              leftIcon={<Github className="w-5 h-5" />}
            >
              Get Started Free
            </Button>
            <Button variant="secondary" size="lg">
              View Demo
            </Button>
          </div>
        </motion.div>

        {/* Floating code preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10 pointer-events-none" />
          <div className="card p-6 mx-auto max-w-4xl border border-ocean-700/30 shadow-2xl shadow-ocean-950/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-coral-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-4 text-sm text-ocean-400">code-review.ts</span>
            </div>
            <pre className="text-sm font-mono overflow-hidden">
              <code className="text-ocean-300">
                <span className="text-coral-400">// AI Review: Security Issue Found</span>
                {'\n'}
                <span className="text-ocean-500">function</span>{' '}
                <span className="text-ocean-200">processUserInput</span>(
                <span className="text-amber-400">input</span>: string) {'{'}
                {'\n'}
                {'  '}
                <span className="text-coral-400 bg-coral-950/50 px-1 rounded">
                  const query = `SELECT * FROM users WHERE id = ${'{'}input{'}'}`
                </span>
                {'\n'}
                {'  '}
                <span className="text-emerald-400">// ✓ Suggestion: Use parameterized queries</span>
                {'\n'}
                {'}'}
              </code>
            </pre>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 bg-surface-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Comprehensive Code Analysis
            </h2>
            <p className="text-ocean-400 max-w-2xl mx-auto">
              Our AI examines every aspect of your code to help you ship better software.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 hover:border-ocean-600/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-600/20 to-ocean-600/5 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-ocean-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-ocean-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-ocean-400 max-w-2xl mx-auto">
              Get started in minutes with a simple three-step process.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-ocean-700 to-transparent" />
                )}
                <div className="text-6xl font-bold text-ocean-800 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-ocean-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card p-12 text-center bg-gradient-to-br from-ocean-900/50 to-surface-secondary border-ocean-700/50"
          >
            <CheckCircle className="w-16 h-16 text-ocean-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to improve your code quality?
            </h2>
            <p className="text-ocean-300 mb-8 max-w-xl mx-auto">
              Join thousands of developers who are shipping better code with AI-powered reviews.
            </p>
            <Button
              onClick={handleLogin}
              size="lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Start Free Trial
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-ocean-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-ocean-400">
              <GitPullRequest className="w-5 h-5" />
              <span className="text-sm">Code Review AI</span>
            </div>
            <p className="text-sm text-ocean-500">
              © {new Date().getFullYear()} Code Review AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

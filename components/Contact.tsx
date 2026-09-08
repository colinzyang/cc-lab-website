import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Users, GraduationCap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useBreadcrumb } from '../src/context/BreadcrumbContext';
import { loadLabInfo, ContactInfo, LabInfo } from '../src/lib/dataLoader';
import { useDocumentTitle } from '../src/hooks/useDocumentTitle';

// ---- Form state types ----
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';
interface FormFields {
  name: string;
  email: string;
  message: string;
}
type FormErrors = Partial<Record<keyof FormFields, string>>;

const EMPTY_FIELDS: FormFields = { name: '', email: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (fields: FormFields): FormErrors => {
  const errors: FormErrors = {};
  if (!fields.name.trim()) errors.name = 'Please enter your name.';
  if (!fields.email.trim()) errors.email = 'Please enter your email.';
  else if (!EMAIL_RE.test(fields.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!fields.message.trim()) errors.message = 'Please enter a message.';
  else if (fields.message.trim().length < 10) errors.message = 'Message should be at least 10 characters.';
  return errors;
};

export const Contact: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumb();
  useDocumentTitle('Contact');
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [labInfo, setLabInfo] = useState<LabInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Form state ----
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');

  const setField = (key: keyof FormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = e.target;
      setFields(prev => ({ ...prev, [key]: value }));
      // Clear the field-level error as the user types
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'submitting') return;

    const validation = validate(fields);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus('submitting');
    const body = new URLSearchParams({
      'form-name': 'contact',
      ...fields,
    }).toString();

    try {
      // Netlify Forms endpoint — submissions appear in the Netlify dashboard
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
      setStatus('success');
      setFields(EMPTY_FIELDS);
    } catch (err) {
      // Fails on localhost dev (no Netlify runtime) or network errors — show mailto fallback
      console.error('Contact form submission error:', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    setBreadcrumbs([{ label: 'Contact' }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    loadLabInfo().then(data => {
      setContact(data.CONTACT);
      setLabInfo(data.LAB_INFO);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading lab info:', error);
      setLoading(false);
    });
  }, []);

  if (loading || !contact || !labInfo) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text mb-6">Get in Touch</h1>
        <p className="text-slate-600 dark:text-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text mb-8">Get in Touch</h1>
        <p className="text-xl text-slate-600 dark:text-text mb-12">
          Interested in our research or collaborations?<br />
          We'd love to hear from you!
        </p>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-text mb-2">Visit Us</h3>
              <p className="text-slate-600 dark:text-subtext leading-relaxed">
                {contact.office}<br />
                {labInfo.fullName}<br />
                {labInfo.affiliation}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <GraduationCap className="w-6 h-6 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-text mb-2">Join</h3>
              <p className="text-slate-600 dark:text-subtext leading-relaxed">
                We're always looking for talented and motivated individuals to join our team.
                Opportunities for graduate students, postdocs, and undergraduate researchers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Users className="w-6 h-6 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-text mb-2">Collaborations</h3>
              <p className="text-slate-600 dark:text-subtext leading-relaxed">
                We actively seek collaborations with experimental labs, clinicians, and industry partners.
              </p>
            </div>

          </div>

          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-text mb-2">Email</h3>
              <p className="text-slate-600 dark:text-subtext leading-relaxed">
                <a href={`mailto:${contact.email}`} className="hover:text-primary dark:hover:text-primary-dark transition-colors">
                  {contact.email}
                </a>
              </p>
            </div>

          </div>

        </div>




      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gray-50 dark:bg-surface p-8 border border-gray-100 dark:border-border"
      >
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center text-center py-12" role="status" aria-live="polite">
            <CheckCircle2 className="w-14 h-14 text-primary dark:text-primary-dark mb-5" aria-hidden="true" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-text mb-2">Message Sent</h3>
            <p className="text-slate-600 dark:text-subtext max-w-sm">
              Thanks for reaching out — we'll get back to you soon.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-7 px-6 py-3 border border-primary dark:border-primary-dark text-primary dark:text-primary-dark font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-white dark:hover:bg-primary-dark dark:hover:text-slate-900 transition-colors"
            >
              Send Another
            </button>
          </div>
        ) : (
          <form
            name="contact"
            data-netlify="true"
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
          >
            <input type="hidden" name="form-name" value="contact" />
            {/* Honeypot — hidden from humans, catches bots */}
            <p className="hidden" aria-hidden="true">
              <label>Don't fill this out if you're human: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label>
            </p>

            {status === 'error' && (
              <div className="flex items-start gap-3 p-4 border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-bold">Something went wrong.</p>
                  <p className="mt-1">
                    Please try again, or email us directly at{' '}
                    <a href={`mailto:${contact.email}`} className="underline font-medium">{contact.email}</a>.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-text uppercase tracking-wide mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={fields.name}
                onChange={setField('name')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={`w-full bg-white dark:bg-surface-1 border ${errors.name ? 'border-red-400 dark:border-red-700' : 'border-gray-300 dark:border-surface'} p-3 focus:outline-none focus:border-primary dark:focus:border-primary-dark transition-colors text-slate-900 dark:text-text`}
                placeholder="Your Name"
              />
              {errors.name && <p id="name-error" className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-text uppercase tracking-wide mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={fields.email}
                onChange={setField('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full bg-white dark:bg-surface-1 border ${errors.email ? 'border-red-400 dark:border-red-700' : 'border-gray-300 dark:border-surface'} p-3 focus:outline-none focus:border-primary dark:focus:border-primary-dark transition-colors text-slate-900 dark:text-text`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-bold text-slate-700 dark:text-text uppercase tracking-wide mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={fields.message}
                onChange={setField('message')}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : undefined}
                className={`w-full bg-white dark:bg-surface-1 border ${errors.message ? 'border-red-400 dark:border-red-700' : 'border-gray-300 dark:border-surface'} p-3 focus:outline-none focus:border-primary dark:focus:border-primary-dark transition-colors text-slate-900 dark:text-text`}
                placeholder="How can we help?"
              ></textarea>
              {errors.message && <p id="message-error" className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-primary dark:bg-primary-dark text-white font-bold uppercase tracking-widest py-4 hover:bg-[#003366] dark:hover:bg-[#5a9fd4] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        )}
      </motion.div>
      </div>
    </div>
  );
};
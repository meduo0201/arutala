import { Navigate } from 'react-router-dom';

// First-run role / couple / age prompts are skipped. New accounts default to
// solo tracker (see migration 0023 + handle_new_user) and can enter the app
// immediately. Couple linking stays available from Settings.
const OnboardingRolePage = () => {
  return <Navigate to="/" replace />;
};

export default OnboardingRolePage;

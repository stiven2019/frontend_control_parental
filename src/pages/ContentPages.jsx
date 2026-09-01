import AppLayout from '../components/AppLayout';
import { MomCare, BabyCare } from './Content';

export function MomCarePage() {
  return (
    <AppLayout>
      <MomCare />
    </AppLayout>
  );
}

export function BabyCarePage() {
  return (
    <AppLayout>
      <BabyCare />
    </AppLayout>
  );
}

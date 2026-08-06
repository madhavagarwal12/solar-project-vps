import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-gutter-mobile md:p-gutter-desktop pb-24 md:pb-8 max-w-2xl mx-auto w-full">
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-primary mb-6">
          Notifications
        </h1>
        <div className="bg-white border border-border-subtle rounded-lg p-8 flex flex-col items-center text-center gap-3 text-on-surface-variant">
          <Icon name="notifications_off" className="text-4xl" />
          <p className="text-body-sm">
            New lead assignments, manager approvals, and customer responses will appear here.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

"use client"

import { StaffPortalLayout } from "@ganger/ui/staff";
import { useStaffAuth } from "@ganger/auth/staff";
import { Button, Card } from "@ganger/ui";

export default function [APP_NAME]Page() {
  const { user, isAuthenticated } = useStaffAuth();

  if (\!isAuthenticated) {
    return <div>Please log in to access [APP_NAME]</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">[APP_NAME]</h1>
        <Button>Add New</Button>
      </div>
      
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Welcome to [APP_NAME]</h2>
        <p className="text-gray-600">
          [APP_DESCRIPTION]
        </p>
        
        <div className="mt-4 space-x-4">
          <Button variant="primary">Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </Card>
    </div>
  );
}

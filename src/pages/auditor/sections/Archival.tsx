import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Archive, Download, Lock, AlertTriangle, CheckCircle } from "lucide-react";

export const Archival = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Archival</h2>
        <p className="text-muted-foreground">
          Archive completed engagement records for long-term storage and compliance
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Archiving an engagement will lock all data and prevent further modifications. 
          Ensure all confirmation work is complete before proceeding.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Engagement Status</CardTitle>
          <CardDescription>Current engagement archival status and actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Sample Sets</p>
              <p className="text-2xl font-bold">3</p>
              <Badge className="mt-2 bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Authorizations</p>
              <p className="text-2xl font-bold">24</p>
              <Badge className="mt-2 bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Confirmations</p>
              <p className="text-2xl font-bold">22/24</p>
              <Badge className="mt-2 bg-warning text-warning-foreground">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Locked Items</p>
              <p className="text-2xl font-bold">18</p>
              <Badge className="mt-2" variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Pre-Archive Checklist</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>All sample sets generated and reviewed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Client authorizations obtained</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span>All confirmation responses received (22/24)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Domain testing completed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Working papers organized by area</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archive Actions</CardTitle>
          <CardDescription>Export and archive engagement data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-1" />
                <div className="text-left">
                  <p className="font-semibold">Export Complete Engagement</p>
                  <p className="text-sm text-muted-foreground">
                    Download all engagement data as PDF/Excel
                  </p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-1" />
                <div className="text-left">
                  <p className="font-semibold">Export Working Papers</p>
                  <p className="text-sm text-muted-foreground">
                    Download confirmation working papers only
                  </p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-1" />
                <div className="text-left">
                  <p className="font-semibold">Export Audit Trail</p>
                  <p className="text-sm text-muted-foreground">
                    Download complete audit log and activity history
                  </p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-1" />
                <div className="text-left">
                  <p className="font-semibold">Export Authorization Logs</p>
                  <p className="text-sm text-muted-foreground">
                    Download client authorization audit trail
                  </p>
                </div>
              </div>
            </Button>
          </div>

          <div className="border-t pt-6">
            <Button className="w-full" size="lg" disabled>
              <Archive className="h-5 w-5 mr-2" />
              Archive Engagement
              <Badge variant="secondary" className="ml-2">2 items pending</Badge>
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-3">
              Complete all pending items to enable archival
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archival Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <strong>Retention Period:</strong> 7 years from engagement completion date
            </p>
            <p className="text-muted-foreground">
              <strong>Access:</strong> Engagement Partner and Engagement Owner will retain read-only access
            </p>
            <p className="text-muted-foreground">
              <strong>Restoration:</strong> Archived engagements can be restored within 30 days with Partner approval
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

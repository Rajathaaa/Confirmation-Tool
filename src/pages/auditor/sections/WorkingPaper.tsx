import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Eye, FileText } from "lucide-react";
import { useState } from "react";

interface ConfirmedData {
  id: string;
  confirmingParty: string;
  recipientEmail: string;
  recipientName: string;
  balanceType: string;
  amountConfirmed: string;
  remarks: string;
  hasAttachment: boolean;
  confirmedDate: string;
}

const AUDIT_AREAS = [
  "Trade Receivables",
  "Trade Payables",
  "Cash & Cash Equivalents",
  "Inventory",
  "Fixed Assets",
];

const mockData: Record<string, ConfirmedData[]> = {
  "Trade Receivables": [
    {
      id: "CNF-001",
      confirmingParty: "ABC Corporation Ltd.",
      recipientEmail: "john.smith@abccorp.com",
      recipientName: "John Smith",
      balanceType: "Accounts Receivable",
      amountConfirmed: "$125,450.00",
      remarks: "Balance confirmed as of December 31, 2024",
      hasAttachment: true,
      confirmedDate: "2025-01-18"
    },
    {
      id: "CNF-004",
      confirmingParty: "DEF Solutions Ltd.",
      recipientEmail: "lisa.wong@defsolutions.com",
      recipientName: "Lisa Wong",
      balanceType: "Accounts Receivable",
      amountConfirmed: "$87,230.50",
      remarks: "Confirmed with minor variance of $150",
      hasAttachment: false,
      confirmedDate: "2025-01-19"
    }
  ],
  "Trade Payables": [
    {
      id: "CNF-003",
      confirmingParty: "Global Supplies Inc.",
      recipientEmail: "m.brown@globalsupplies.com",
      recipientName: "Michael Brown",
      balanceType: "Accounts Payable",
      amountConfirmed: "$45,890.00",
      remarks: "Balance confirmed, payment terms 30 days",
      hasAttachment: true,
      confirmedDate: "2025-01-20"
    }
  ],
  "Cash & Cash Equivalents": [],
  "Inventory": [],
  "Fixed Assets": []
};

export const WorkingPaper = () => {
  const [selectedArea, setSelectedArea] = useState("Trade Receivables");

  const currentData = mockData[selectedArea] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Confirmation Working Paper</h2>
          <p className="text-muted-foreground">
            Review and organize confirmation responses by audit area
          </p>
        </div>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIT_AREAS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedArea}</CardTitle>
              <CardDescription>
                {currentData.length} confirmation{currentData.length !== 1 ? 's' : ''} received
              </CardDescription>
            </div>
            {currentData.length > 0 && (
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Push to Main Software
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Confirming Party</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Balance Type</TableHead>
                    <TableHead>Amount Confirmed</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.confirmingParty}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.recipientName}</p>
                          <code className="text-xs text-muted-foreground">
                            {item.recipientEmail}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>{item.balanceType}</TableCell>
                      <TableCell className="font-semibold">{item.amountConfirmed}</TableCell>
                      <TableCell>{item.confirmedDate}</TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate" title={item.remarks}>
                          {item.remarks}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.hasAttachment && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Confirmations</h3>
              <p className="text-muted-foreground">
                No confirmations have been received for {selectedArea} yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {currentData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Confirmations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{currentData.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${currentData.reduce((sum, item) => {
                  const amount = parseFloat(item.amountConfirmed.replace(/[$,]/g, ''));
                  return sum + amount;
                }, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {currentData.filter(item => item.hasAttachment).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

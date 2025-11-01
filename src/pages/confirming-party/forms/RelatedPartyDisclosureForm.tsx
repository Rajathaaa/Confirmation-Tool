import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const RelatedPartyDisclosureForm = ({ confirmation }: { confirmation: any }) => {
  const [relationshipResponses, setRelationshipResponses] = useState({
    whollyOwnedSubsidiary: "",
    subsidiary: "",
    fellowSubsidiary: "",
    jointVenture: "",
    associate: "",
    kmp: "",
    relativeOfKmp: "",
    companyWithKmp: "",
    otherRelationship: "",
    changeInRelationship: ""
  });

  const [transactions, setTransactions] = useState([{ nature: "", currency: "", amount: "" }]);
  const [hasLoansBorrowed, setHasLoansBorrowed] = useState("");
  const [hasLoansGiven, setHasLoansGiven] = useState("");
  const [outstandingBalances, setOutstandingBalances] = useState([{ nature: "", currency: "", amount: "", overdue: "" }]);
  const [otherItems, setOtherItems] = useState([{ particulars: "", currency: "", amount: "" }]);

  const handleSubmit = (data: any) => {
    const submitData = {
      ...data,
      relationshipResponses,
      transactions,
      hasLoansBorrowed,
      hasLoansGiven,
      outstandingBalances,
      otherItems,
      area: confirmation.area
    };
    console.log("Submitting:", submitData);
    alert("Confirmation submitted successfully!");
  };

  const updateRelationship = (field: string, value: string) => {
    setRelationshipResponses(prev => ({ ...prev, [field]: value }));
  };

  const addTransactionRow = () => {
    setTransactions([...transactions, { nature: "", currency: "", amount: "" }]);
  };

  const removeTransactionRow = (index: number) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  const updateTransaction = (index: number, field: string, value: string) => {
    const newRows = [...transactions];
    newRows[index] = { ...newRows[index], [field]: value };
    setTransactions(newRows);
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText="We certify that the above particulars (read alongwith the attachments if any) are full and correct and have been executed at arm's length*. *The expression arm's length means a transaction between two related parties that is conducted as if they were unrelated, so that there is no conflict of interest."
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        {/* Nature of relationship */}
        <div className="space-y-4">
          <h4 className="font-semibold">Nature of relationship with {confirmation.confirmationFor}</h4>
          <div className="rounded-md border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Wholly Owned Subsidiary</Label>
                <Select value={relationshipResponses.whollyOwnedSubsidiary} onValueChange={(v) => updateRelationship("whollyOwnedSubsidiary", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subsidiary</Label>
                <Select value={relationshipResponses.subsidiary} onValueChange={(v) => updateRelationship("subsidiary", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fellow Subsidiary</Label>
                <Select value={relationshipResponses.fellowSubsidiary} onValueChange={(v) => updateRelationship("fellowSubsidiary", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Joint Venture</Label>
                <Select value={relationshipResponses.jointVenture} onValueChange={(v) => updateRelationship("jointVenture", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Associate</Label>
                <Select value={relationshipResponses.associate} onValueChange={(v) => updateRelationship("associate", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Key Managerial Personnel [KMP]</Label>
                <Select value={relationshipResponses.kmp} onValueChange={(v) => updateRelationship("kmp", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Relative of KMP</Label>
                <Select value={relationshipResponses.relativeOfKmp} onValueChange={(v) => updateRelationship("relativeOfKmp", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company in which KMP or relative has significant influence</Label>
                <Select value={relationshipResponses.companyWithKmp} onValueChange={(v) => updateRelationship("companyWithKmp", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Any other relationship (not mentioned above)</Label>
              <Input value={relationshipResponses.otherRelationship} onChange={(e) => updateRelationship("otherRelationship", e.target.value)} placeholder="Enter details" />
            </div>
            <div className="space-y-2">
              <Label>Any change in relationship during the year or subsequent to year-end</Label>
              <Textarea value={relationshipResponses.changeInRelationship} onChange={(e) => updateRelationship("changeInRelationship", e.target.value)} placeholder="Enter details" rows={2} />
            </div>
          </div>
        </div>

        {/* Details of transactions */}
        <div className="space-y-2">
          <h4 className="font-semibold">Details of transactions with {confirmation.confirmationFor} during the year ended {confirmation.periodEndDate}</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nature of Transaction</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount Involved</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.nature} onChange={(e) => updateTransaction(index, "nature", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateTransaction(index, "currency", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={row.amount} onChange={(e) => updateTransaction(index, "amount", e.target.value)} /></TableCell>
                    <TableCell>{transactions.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeTransactionRow(index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addTransactionRow}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* Loans borrowed section - simplified for brevity */}
        <div className="space-y-2">
          <h4 className="font-semibold">Are there any loans borrowed by [Confirming Party]?</h4>
          <Select value={hasLoansBorrowed} onValueChange={setHasLoansBorrowed}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Loans given section */}
        <div className="space-y-2">
          <h4 className="font-semibold">Are there any loans given by [Confirming Party]?</h4>
          <Select value={hasLoansGiven} onValueChange={setHasLoansGiven}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Outstanding balances */}
        <div className="space-y-2">
          <h4 className="font-semibold">Details of outstanding balances with [Confirming Party] as at {confirmation.periodEndDate}</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nature of balance</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount Outstanding</TableHead>
                  <TableHead>Overdue Amount (if any)</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingBalances.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.nature} onChange={(e) => {
                      const newRows = [...outstandingBalances];
                      newRows[index].nature = e.target.value;
                      setOutstandingBalances(newRows);
                    }} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => {
                      const newRows = [...outstandingBalances];
                      newRows[index].currency = e.target.value;
                      setOutstandingBalances(newRows);
                    }} /></TableCell>
                    <TableCell><Input type="number" value={row.amount} onChange={(e) => {
                      const newRows = [...outstandingBalances];
                      newRows[index].amount = e.target.value;
                      setOutstandingBalances(newRows);
                    }} /></TableCell>
                    <TableCell><Input type="number" value={row.overdue} onChange={(e) => {
                      const newRows = [...outstandingBalances];
                      newRows[index].overdue = e.target.value;
                      setOutstandingBalances(newRows);
                    }} /></TableCell>
                    <TableCell>{outstandingBalances.length > 1 && <Button size="sm" variant="ghost" onClick={() => setOutstandingBalances(outstandingBalances.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOutstandingBalances([...outstandingBalances, { nature: "", currency: "", amount: "", overdue: "" }])}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>
      </div>
    </BaseConfirmationForm>
  );
};

export default RelatedPartyDisclosureForm;
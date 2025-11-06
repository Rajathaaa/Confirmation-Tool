import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatNumberInput, parseIndianNumber, formatIndianDate } from "@/lib/utils";

const RelatedPartyDisclosureForm = ({ confirmation }: { confirmation: any }) => {
  // Nature of relationship state
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

  // Transactions state
  const [transactions, setTransactions] = useState([{ nature: "", currency: "", amount: "" }]);

  // Loans borrowed state
  const [hasLoansBorrowed, setHasLoansBorrowed] = useState("");
  const [loansBorrowed, setLoansBorrowed] = useState({
    principalAmount: "",
    currency: "",
    purposeDuringYear: "",
    purposePriorYear: "",
    unutilizedAmount: "",
    unutilizedDeployed: "",
    loanAmountPayable: "",
    interestRate: "",
    interestAmountPayable: "",
    overdueAmount: "",
    principalDueOneYear: "",
    modifications: ""
  });
  const [borrowedSecurities, setBorrowedSecurities] = useState([
    { type: "Primary Securities", nature: "", value: "" },
    { type: "Collateral Securities", nature: "", value: "" }
  ]);

  // Loans given state
  const [hasLoansGiven, setHasLoansGiven] = useState("");
  const [loansGiven, setLoansGiven] = useState({
    principalAmount: "",
    currency: "",
    loanAmountReceivable: "",
    interestRate: "",
    interestAmountReceivable: "",
    overdueAmount: "",
    principalDueOneYear: "",
    modifications: ""
  });
  const [givenSecurities, setGivenSecurities] = useState([
    { type: "Primary Securities", nature: "", value: "" },
    { type: "Collateral Securities", nature: "", value: "" }
  ]);

  // Outstanding balances state
  const [outstandingBalances, setOutstandingBalances] = useState([{ nature: "", currency: "", amount: "", overdue: "" }]);

  // Other items state
  const [otherItems, setOtherItems] = useState([{ particulars: "", currency: "", amount: "" }]);

  const handleSubmit = (data: any) => {
    const submitData = {
      ...data,
      relationshipResponses,
      transactions,
      hasLoansBorrowed,
      loansBorrowed: hasLoansBorrowed === "yes" ? loansBorrowed : null,
      borrowedSecurities: hasLoansBorrowed === "yes" ? borrowedSecurities : null,
      hasLoansGiven,
      loansGiven: hasLoansGiven === "yes" ? loansGiven : null,
      givenSecurities: hasLoansGiven === "yes" ? givenSecurities : null,
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

  const addOutstandingBalanceRow = () => {
    setOutstandingBalances([...outstandingBalances, { nature: "", currency: "", amount: "", overdue: "" }]);
  };

  const removeOutstandingBalanceRow = (index: number) => {
    setOutstandingBalances(outstandingBalances.filter((_, i) => i !== index));
  };

  const updateOutstandingBalance = (index: number, field: string, value: string) => {
    const newRows = [...outstandingBalances];
    newRows[index] = { ...newRows[index], [field]: value };
    setOutstandingBalances(newRows);
  };

  const addOtherItemRow = () => {
    setOtherItems([...otherItems, { particulars: "", currency: "", amount: "" }]);
  };

  const removeOtherItemRow = (index: number) => {
    setOtherItems(otherItems.filter((_, i) => i !== index));
  };

  const updateOtherItem = (index: number, field: string, value: string) => {
    const newRows = [...otherItems];
    newRows[index] = { ...newRows[index], [field]: value };
    setOtherItems(newRows);
  };

  const updateBorrowedSecurity = (index: number, field: string, value: string) => {
    const newRows = [...borrowedSecurities];
    newRows[index] = { ...newRows[index], [field]: value };
    setBorrowedSecurities(newRows);
  };

  const updateGivenSecurity = (index: number, field: string, value: string) => {
    const newRows = [...givenSecurities];
    newRows[index] = { ...newRows[index], [field]: value };
    setGivenSecurities(newRows);
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText={`We certify that the above particulars (read alongwith the attachments if any) are full and correct and have been executed at arm's length*.\n\n*The expression arm's length means a transaction between two related parties that is conducted as if they were unrelated, so that there is no conflict of interest.`}
      onSubmit={handleSubmit}
    >
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground">
          Kindly confirm to us the details required as below in respect of all the transactions between {confirmation.confirmationFor || "[Client Organization name]"} and [Confirming Party].
        </p>

        {/* Nature of relationship */}
        <div className="space-y-4">
          <h4 className="font-semibold">Nature of relationship with {confirmation.confirmationFor || "[Client Organization Name]"}</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Sl. No.</TableHead>
                  <TableHead>Nature of Relationship as at {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period end date]"}</TableHead>
                  <TableHead>Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">1.</TableCell>
                  <TableCell>Wholly Owned Subsidiary</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.whollyOwnedSubsidiary} onValueChange={(v) => updateRelationship("whollyOwnedSubsidiary", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">2.</TableCell>
                  <TableCell>Subsidiary</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.subsidiary} onValueChange={(v) => updateRelationship("subsidiary", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3.</TableCell>
                  <TableCell>Fellow Subsidiary</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.fellowSubsidiary} onValueChange={(v) => updateRelationship("fellowSubsidiary", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">4.</TableCell>
                  <TableCell>Joint Venture</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.jointVenture} onValueChange={(v) => updateRelationship("jointVenture", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">5.</TableCell>
                  <TableCell>Associate</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.associate} onValueChange={(v) => updateRelationship("associate", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">6.</TableCell>
                  <TableCell>Key Managerial Personnel [KMP]</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.kmp} onValueChange={(v) => updateRelationship("kmp", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">7.</TableCell>
                  <TableCell>Relative of KMP</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.relativeOfKmp} onValueChange={(v) => updateRelationship("relativeOfKmp", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">8.</TableCell>
                  <TableCell>Company in which KMP or his/her relative has significant influence</TableCell>
                  <TableCell>
                    <Select value={relationshipResponses.companyWithKmp} onValueChange={(v) => updateRelationship("companyWithKmp", v)}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">9.</TableCell>
                  <TableCell>Any other relationship (not mentioned above)</TableCell>
                  <TableCell>
                    <Input 
                      value={relationshipResponses.otherRelationship} 
                      onChange={(e) => updateRelationship("otherRelationship", e.target.value)} 
                      placeholder="Enter details"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">10.</TableCell>
                  <TableCell>Any change in relationship during the year or subsequent to year-end</TableCell>
                  <TableCell>
                    <Input 
                      value={relationshipResponses.changeInRelationship} 
                      onChange={(e) => updateRelationship("changeInRelationship", e.target.value)} 
                      placeholder="Enter details"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Details of transactions */}
        <div className="space-y-2">
          <h4 className="font-semibold">Details of transactions with {confirmation.confirmationFor || "[Client Organization Name]"} during the year ended {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period End Date]"}</h4>
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
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.amount)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateTransaction(index, "amount", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell>{transactions.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeTransactionRow(index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addTransactionRow}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* Loans borrowed */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Are there any loans borrowed by [Confirming Party]?</h4>
            <Select value={hasLoansBorrowed} onValueChange={setHasLoansBorrowed}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
            </Select>
          </div>

          {hasLoansBorrowed === "yes" && (
            <div className="space-y-4 pl-4 border-l-2">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Particulars</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Principal Amount borrowed</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansBorrowed.principalAmount)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansBorrowed(prev => ({ ...prev, principalAmount: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Currency (all amounts to be in currency mentioned)</TableCell>
                      <TableCell><Input value={loansBorrowed.currency} onChange={(e) => setLoansBorrowed(prev => ({ ...prev, currency: e.target.value }))} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Purpose for which the loan proceeds were utilized:<br />a) In respect of loans borrowed during the year<br />b) In respect of loans borrowed in prior year and outstanding as at the balance sheet date</TableCell>
                      <TableCell>
                        <Textarea 
                          value={loansBorrowed.purposeDuringYear} 
                          onChange={(e) => setLoansBorrowed(prev => ({ ...prev, purposeDuringYear: e.target.value }))} 
                          placeholder="a) Enter details&#10;b) Enter details"
                          rows={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">a) Unutilized loan amount as at the period end date<br />b) In respect of amount per a) above, where have such amounts been deployed temporarily.</TableCell>
                      <TableCell>
                        <Textarea 
                          value={loansBorrowed.unutilizedAmount} 
                          onChange={(e) => setLoansBorrowed(prev => ({ ...prev, unutilizedAmount: e.target.value }))} 
                          placeholder="a) Enter amount&#10;b) Enter deployment details"
                          rows={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Loan amount payable as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period end date]"} (also include balances outstanding in respect of transactions during prior years)</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansBorrowed.loanAmountPayable)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansBorrowed(prev => ({ ...prev, loanAmountPayable: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Interest rate during the year and interest amount</TableCell>
                      <TableCell>
                        <Input value={loansBorrowed.interestRate} onChange={(e) => setLoansBorrowed(prev => ({ ...prev, interestRate: e.target.value }))} placeholder="Enter rate and amount" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Interest amount payable as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period end date]"} (also include balances outstanding in respect of interest related to prior years)</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansBorrowed.interestAmountPayable)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansBorrowed(prev => ({ ...prev, interestAmountPayable: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Overdue amount as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end date]"} (also include balances outstanding in respect of transactions related to prior years)</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansBorrowed.overdueAmount)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansBorrowed(prev => ({ ...prev, overdueAmount: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Principal amounts due within one year</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansBorrowed.principalDueOneYear)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansBorrowed(prev => ({ ...prev, principalDueOneYear: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Details of any loans extended, renewed or any other modifications (including loans borrowed in prior years)</TableCell>
                      <TableCell>
                        <Textarea value={loansBorrowed.modifications} onChange={(e) => setLoansBorrowed(prev => ({ ...prev, modifications: e.target.value }))} rows={3} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Security details for loans borrowed */}
              <div className="space-y-2">
                <h5 className="font-medium">Details of Security</h5>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Particulars</TableHead>
                        <TableHead>Nature of Security</TableHead>
                        <TableHead>Value & Currency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {borrowedSecurities.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.type}</TableCell>
                          <TableCell>
                            <Input value={row.nature} onChange={(e) => updateBorrowedSecurity(index, "nature", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.value} onChange={(e) => updateBorrowedSecurity(index, "value", e.target.value)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loans given */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Are there any loans given by [Confirming Party]?</h4>
            <Select value={hasLoansGiven} onValueChange={setHasLoansGiven}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
            </Select>
          </div>

          {hasLoansGiven === "yes" && (
            <div className="space-y-4 pl-4 border-l-2">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Particulars</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Principal Amount given</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansGiven.principalAmount)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansGiven(prev => ({ ...prev, principalAmount: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Currency (all amounts to be in currency mentioned)</TableCell>
                      <TableCell><Input value={loansGiven.currency} onChange={(e) => setLoansGiven(prev => ({ ...prev, currency: e.target.value }))} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Loan amount receivable as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period end date]"} (also include balances outstanding in respect of transactions during prior years)</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansGiven.loanAmountReceivable)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansGiven(prev => ({ ...prev, loanAmountReceivable: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Interest rate charged during the year and interest amount</TableCell>
                      <TableCell>
                        <Input value={loansGiven.interestRate} onChange={(e) => setLoansGiven(prev => ({ ...prev, interestRate: e.target.value }))} placeholder="Enter rate and amount" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Interest amount receivable as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period end date]"} (also include balances outstanding in respect of interest related to prior years)</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansGiven.interestAmountReceivable)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansGiven(prev => ({ ...prev, interestAmountReceivable: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Overdue amount as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end date]"} (also include balances outstanding in respect of transactions related to prior years)</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansGiven.overdueAmount)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansGiven(prev => ({ ...prev, overdueAmount: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Principal amounts due within one year</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formatNumberInput(loansGiven.principalDueOneYear)}
                          onChange={(e) => {
                            const numericValue = parseIndianNumber(e.target.value);
                            setLoansGiven(prev => ({ ...prev, principalDueOneYear: numericValue.toString() }));
                          }}
                          placeholder="Enter amount"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Details of any loans extended, renewed or any other modifications (including loans given in prior years)</TableCell>
                      <TableCell>
                        <Textarea value={loansGiven.modifications} onChange={(e) => setLoansGiven(prev => ({ ...prev, modifications: e.target.value }))} rows={3} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Security details for loans given */}
              <div className="space-y-2">
                <h5 className="font-medium">Details of Security</h5>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Particulars</TableHead>
                        <TableHead>Nature of Security</TableHead>
                        <TableHead>Value & Currency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {givenSecurities.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.type}</TableCell>
                          <TableCell>
                            <Input value={row.nature} onChange={(e) => updateGivenSecurity(index, "nature", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.value} onChange={(e) => updateGivenSecurity(index, "value", e.target.value)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Outstanding balances */}
        <div className="space-y-2">
          <h4 className="font-semibold">Details of outstanding balances with [Confirming Party] as at {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end date]"}</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nature of balance (e.g. accounts receivable, accounts payable)</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount Outstanding</TableHead>
                  <TableHead>Overdue Amount (if any)</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingBalances.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.nature} onChange={(e) => updateOutstandingBalance(index, "nature", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateOutstandingBalance(index, "currency", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.amount)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateOutstandingBalance(index, "amount", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.overdue)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateOutstandingBalance(index, "overdue", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell>{outstandingBalances.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeOutstandingBalanceRow(index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOutstandingBalanceRow}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>

        {/* Other items */}
        <div className="space-y-2">
          <h4 className="font-semibold">Details of other items not covered above (including those given/taken in previous years)</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Particulars (e.g. guarantees, credit lines, security offered)</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount involved</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherItems.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><Input value={row.particulars} onChange={(e) => updateOtherItem(index, "particulars", e.target.value)} /></TableCell>
                    <TableCell><Input value={row.currency} onChange={(e) => updateOtherItem(index, "currency", e.target.value)} /></TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={formatNumberInput(row.amount)}
                        onChange={(e) => {
                          const numericValue = parseIndianNumber(e.target.value);
                          updateOtherItem(index, "amount", numericValue.toString());
                        }}
                        placeholder="Enter amount"
                      />
                    </TableCell>
                    <TableCell>{otherItems.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeOtherItemRow(index)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOtherItemRow}><Plus className="h-4 w-4 mr-2" />Add Row</Button>
        </div>
      </div>
    </BaseConfirmationForm>
  );
};

export default RelatedPartyDisclosureForm;
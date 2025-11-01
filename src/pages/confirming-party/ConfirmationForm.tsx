import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import CashAndCashEquivalentsForm from "./forms/CashAndCashEquivalentsForm";
import LitigationsAndClaimsForm from "./forms/LitigationsAndClaimsForm";
import RelatedPartyDisclosureForm from "./forms/RelatedPartyDisclosureForm";
import BorrowingsForm from "./forms/BorrowingsForm";
import InventoryForm from "./forms/InventoryForm";
import OtherAssetsSecurityDepositsForm from "./forms/OtherAssetsSecurityDepositsForm";
import OtherLiabilitiesSecurityDepositsForm from "./forms/OtherLiabilitiesSecurityDepositsForm";
import OtherReceivablesAdvanceToSupplierForm from "./forms/OtherReceivablesAdvanceToSupplierForm";
import OtherReceivablesCapitalAdvancesForm from "./forms/OtherReceivablesCapitalAdvancesForm";
import OtherLiabilitiesAdvanceFromCustomerForm from "./forms/OtherLiabilitiesAdvanceFromCustomerForm";
import OtherLiabilitiesCapexVendorsForm from "./forms/OtherLiabilitiesCapexVendorsForm";
import PlanAssetsForm from "./forms/PlanAssetsForm";
import TrusteeForm from "./forms/TrusteeForm";
import TradePayablesForm from "./forms/TradePayablesForm";
import TradeReceivablesForm from "./forms/TradeReceivablesForm";

const ConfirmationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    if (location.state?.confirmation) {
      setConfirmation(location.state.confirmation);
    }
  }, [location.state]);

  if (!confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Loading confirmation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderFormByArea = () => {
    switch (confirmation.area) {
      case "Cash & Cash Equivalents":
        return <CashAndCashEquivalentsForm confirmation={confirmation} />;
      case "Litigations & Claims":
        return <LitigationsAndClaimsForm confirmation={confirmation} />;
      case "Related Party Disclosure":
        return <RelatedPartyDisclosureForm confirmation={confirmation} />;
      case "Borrowings":
        return <BorrowingsForm confirmation={confirmation} />;
      case "Inventory":
        return <InventoryForm confirmation={confirmation} />;
      case "Other Assets - Security Deposits":
        return <OtherAssetsSecurityDepositsForm confirmation={confirmation} />;
      case "Other Liabilities - Security Deposits":
        return <OtherLiabilitiesSecurityDepositsForm confirmation={confirmation} />;
      case "Other Receivables - Advance to Supplier":
        return <OtherReceivablesAdvanceToSupplierForm confirmation={confirmation} />;
      case "Other Receivables - Capital Advances":
        return <OtherReceivablesCapitalAdvancesForm confirmation={confirmation} />;
      case "Other Liabilities - Advance from Customer":
        return <OtherLiabilitiesAdvanceFromCustomerForm confirmation={confirmation} />;
      case "Other Liabilities - Capex Vendors":
        return <OtherLiabilitiesCapexVendorsForm confirmation={confirmation} />;
      case "Plan Assets":
        return <PlanAssetsForm confirmation={confirmation} />;
      case "Trustee":
        return <TrusteeForm confirmation={confirmation} />;
      case "Trade Payables":
        return <TradePayablesForm confirmation={confirmation} />;
      case "Trade Receivables":
        return <TradeReceivablesForm confirmation={confirmation} />;
      default:
        return <div>Form not found for area: {confirmation.area}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/confirming-party/confirmations")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {confirmation.area} - {confirmation.confirmationFor}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Confirmation ID: {confirmation.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {renderFormByArea()}
      </div>
    </div>
  );
};

export default ConfirmationForm;

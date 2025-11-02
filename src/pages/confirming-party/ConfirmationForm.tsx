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

// Mock data fallback - in real app, this would come from an API
const mockConfirmations: Record<string, any> = {
  "CNF-001": {
    id: "CNF-001",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Cash & Cash Equivalents",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-15"
  },
  "CNF-002": {
    id: "CNF-002",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Trade Receivables",
    status: "draft",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-16"
  },
  "CNF-003": {
    id: "CNF-003",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Litigations & Claims",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-17"
  },
  "CNF-004": {
    id: "CNF-004",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Related Party Disclosure",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-18"
  },
  "CNF-005": {
    id: "CNF-005",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Borrowings",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-19"
  },
  "CNF-006": {
    id: "CNF-006",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Inventory",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-20"
  },
  "CNF-007": {
    id: "CNF-007",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Assets - Security Deposits",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-21"
  },
  "CNF-008": {
    id: "CNF-008",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Liabilities - Security Deposits",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-22"
  },
  "CNF-009": {
    id: "CNF-009",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Receivables - Advance to Supplier",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-23"
  },
  "CNF-010": {
    id: "CNF-010",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Receivables - Capital Advances",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-24"
  },
  "CNF-011": {
    id: "CNF-011",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Liabilities - Advance from Customer",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-25"
  },
  "CNF-012": {
    id: "CNF-012",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Liabilities - Capex Vendors",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-26"
  },
  "CNF-013": {
    id: "CNF-013",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Plan Assets",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-27"
  },
  "CNF-014": {
    id: "CNF-014",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Trustee",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-28"
  },
  "CNF-015": {
    id: "CNF-015",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Trade Payables",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-29"
  }
};

const ConfirmationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [confirmation, setConfirmation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // First, try to get confirmation from location state
    if (location.state?.confirmation) {
      setConfirmation(location.state.confirmation);
      setError(null);
      return;
    }

    // If state is not available, try to get from mock data using the ID from URL
    if (id && mockConfirmations[id]) {
      setConfirmation(mockConfirmations[id]);
      setError(null);
      return;
    }

    // If still not found, show error
    if (id) {
      setError(`Confirmation with ID ${id} not found.`);
    } else {
      setError("No confirmation ID provided.");
    }
  }, [location.state, id]);

  if (error) {
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
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Error</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => navigate("/confirming-party/confirmations")}>
                Return to Confirmations List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!confirmation) {
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
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Loading...</h1>
            </div>
          </div>
        </header>
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
    if (!confirmation.area) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Confirmation area is missing.</p>
          </CardContent>
        </Card>
      );
    }

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
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">
                Form not found for area: {confirmation.area}
              </p>
            </CardContent>
          </Card>
        );
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
                  {confirmation.area || "Confirmation"} - {confirmation.confirmationFor || "Unknown"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Confirmation ID: {confirmation.id || id || "Unknown"}
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

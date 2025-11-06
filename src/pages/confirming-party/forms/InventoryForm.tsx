import { BaseConfirmationForm } from "./BaseConfirmationForm";
import { formatIndianDate } from "@/lib/utils";

const InventoryForm = ({ confirmation }: { confirmation: any }) => {
  const handleSubmit = (data: any) => {
    console.log("Submitting:", data);
    alert("Confirmation submitted successfully!");
  };

  return (
    <BaseConfirmationForm
      confirmation={confirmation}
      certificationText="We certify that the above particulars (read alongwith the attachments if any) are full and correct and do not exclude any other items received by us on this behalf."
      onSubmit={handleSubmit}
    >
      <p className="text-sm text-muted-foreground mb-4">
        Kindly confirm to us the list of inventory located at your warehouse as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end Date]"} on behalf of {confirmation.confirmationFor}. The list shall include details of the item, quantity of inventory held and other such details as deemed necessary.
      </p>
    </BaseConfirmationForm>
  );
};

export default InventoryForm;

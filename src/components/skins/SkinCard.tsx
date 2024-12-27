import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Gem, Check } from "lucide-react";

interface SkinCardProps {
  skin: {
    id: string;
    title: string;
    description: string | null;
    preview_url: string | null;
    cost: number;
    type: string;
  };
  canPurchase: boolean;
}

export const SkinCard = ({ skin, canPurchase }: SkinCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const purchaseSkin = async () => {
    try {
      setIsPurchasing(true);

      // Insérer l'achat du skin
      const { error: purchaseError } = await supabase
        .from("user_skins")
        .insert([{ 
          skin_id: skin.id,
          is_active: false
        }]);

      if (purchaseError) throw purchaseError;

      // Déduire l'XP
      const { error: xpError } = await supabase
        .from("habit_logs")
        .insert([{
          habit_id: null,
          experience_gained: -skin.cost,
          notes: `Achat du skin: ${skin.title}`
        }]);

      if (xpError) throw xpError;

      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["totalXP"] });
      queryClient.invalidateQueries({ queryKey: ["userSkins"] });

      toast({
        title: "Skin débloqué !",
        description: `Vous avez débloqué : ${skin.title}`,
      });
    } catch (error) {
      console.error("Erreur lors de l'achat:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'acheter le skin.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-background/50 to-background/30 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      {skin.preview_url && (
        <div className="mb-4 aspect-video w-full overflow-hidden rounded-md">
          <img 
            src={skin.preview_url} 
            alt={skin.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{skin.title}</h3>
          <div className="flex items-center gap-1 bg-background/40 px-2 py-1 rounded-full text-sm">
            <Gem className="w-4 h-4 text-primary" />
            <span>{skin.cost}</span>
          </div>
        </div>

        {skin.description && (
          <p className="text-sm text-muted-foreground">{skin.description}</p>
        )}

        <Button
          onClick={purchaseSkin}
          disabled={!canPurchase || isPurchasing}
          variant={canPurchase ? "default" : "outline"}
          className="w-full"
        >
          {canPurchase ? (
            isPurchasing ? (
              "Achat en cours..."
            ) : (
              "Acheter"
            )
          ) : (
            "Points insuffisants"
          )}
        </Button>
      </div>
    </div>
  );
};
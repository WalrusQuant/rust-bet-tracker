import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Bet } from '@/types';
import { calculateEV, calculateCLV, calculateProfit, formatAmericanOdds } from '@/lib/oddsUtils';

interface BetDetailsDialogProps {
  bet: Bet | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (bet: Bet) => void;
}

export function BetDetailsDialog({ bet, isOpen, onOpenChange, onEdit }: BetDetailsDialogProps) {
  if (!bet) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bet Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="font-medium">{format(new Date(bet.bet_date), 'PPP')}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <p>
                <span className={`px-2 py-1 rounded text-xs ${
                  bet.outcome === 'won' ? 'bg-green-500/20 text-green-500' :
                  bet.outcome === 'lost' ? 'bg-red-500/20 text-red-500' :
                  bet.outcome === 'push' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {bet.outcome}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Sportsbook</Label>
              <p className="font-medium">{bet.sportsbooks?.name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">League</Label>
              <p className="font-medium">{bet.leagues?.name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Bet Type</Label>
              <p className="font-medium">{bet.bet_types?.name || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Bet Odds</Label>
              <p className="font-mono text-lg">{formatAmericanOdds(bet.odds)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Stake</Label>
              <p className="text-lg">${bet.stake}</p>
            </div>
          </div>

          {bet.fair_odds && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Fair Odds</Label>
                <p className="font-mono">{formatAmericanOdds(bet.fair_odds)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Expected Value (EV)</Label>
                <p className={`font-medium ${calculateEV(bet.odds, bet.fair_odds, bet.stake) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateEV(bet.odds, bet.fair_odds, bet.stake).toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {bet.closing_odds && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Closing Odds</Label>
                <p className="font-mono">{formatAmericanOdds(bet.closing_odds)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Closing Line Value (CLV)</Label>
                <p className={`font-medium ${calculateCLV(bet.odds, bet.closing_odds) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateCLV(bet.odds, bet.closing_odds).toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {(bet.outcome === 'won' || bet.outcome === 'lost') && (
            <div>
              <Label className="text-muted-foreground">Profit/Loss</Label>
              <p className={`text-xl font-bold ${
                bet.outcome === 'won'
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {bet.outcome === 'won'
                  ? `+$${calculateProfit(bet.odds, bet.stake).toFixed(2)}`
                  : `-$${bet.stake.toFixed(2)}`
                }
              </p>
            </div>
          )}

          {bet.notes && (
            <div>
              <Label className="text-muted-foreground">Notes</Label>
              <div className="mt-2 p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{bet.notes}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={() => {
              onOpenChange(false);
              onEdit(bet);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Bet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

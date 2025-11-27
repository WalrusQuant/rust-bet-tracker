import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Bet } from '@/types';
import { calculateEV, calculateCLV, formatAmericanOdds } from '@/lib/oddsUtils';

interface BetTableProps {
  bets: Bet[];
  isLoading: boolean;
  onView: (bet: Bet) => void;
  onEdit: (bet: Bet) => void;
  onDelete: (id: string) => void;
}

export function BetTable({ bets, isLoading, onView, onEdit, onDelete }: BetTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Sportsbook</TableHead>
                <TableHead>League</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Odds</TableHead>
                <TableHead>Fair</TableHead>
                <TableHead>Close</TableHead>
                <TableHead>Stake</TableHead>
                <TableHead>EV%</TableHead>
                <TableHead>CLV%</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : bets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center">No bets found</TableCell>
                </TableRow>
              ) : (
                bets.map((bet) => {
                  const ev = bet.fair_odds ? calculateEV(bet.odds, bet.fair_odds, bet.stake) : null;
                  const clv = bet.closing_odds ? calculateCLV(bet.odds, bet.closing_odds) : null;

                  return (
                    <TableRow key={bet.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(bet)}>
                      <TableCell className="whitespace-nowrap">{bet.bet_date}</TableCell>
                      <TableCell>{bet.sportsbooks?.name || '-'}</TableCell>
                      <TableCell>{bet.leagues?.name || '-'}</TableCell>
                      <TableCell>{bet.bet_types?.name || '-'}</TableCell>
                      <TableCell className="font-mono">{formatAmericanOdds(bet.odds)}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {bet.fair_odds ? formatAmericanOdds(bet.fair_odds) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {bet.closing_odds ? formatAmericanOdds(bet.closing_odds) : '-'}
                      </TableCell>
                      <TableCell>${bet.stake}</TableCell>
                      <TableCell className={ev !== null ? (ev >= 0 ? 'text-green-500' : 'text-red-500') : ''}>
                        {ev !== null ? `${ev.toFixed(2)}%` : '-'}
                      </TableCell>
                      <TableCell className={clv !== null ? (clv >= 0 ? 'text-green-500' : 'text-red-500') : ''}>
                        {clv !== null ? `${clv.toFixed(2)}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          bet.outcome === 'won' ? 'bg-green-500/20 text-green-500' :
                          bet.outcome === 'lost' ? 'bg-red-500/20 text-red-500' :
                          bet.outcome === 'push' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {bet.outcome}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => onEdit(bet)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(bet.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

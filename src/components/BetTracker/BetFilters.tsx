import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Plus } from 'lucide-react';
import { Sportsbook, League, BetType, FilterState } from '@/types';

interface BetFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  sportsbooks: Sportsbook[];
  leagues: League[];
  betTypes: BetType[];
  onExport: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  isImporting: boolean;
}

export function BetFilters({
  filters,
  onFilterChange,
  sportsbooks,
  leagues,
  betTypes,
  onExport,
  onImport,
  onDownloadTemplate,
  isImporting,
}: BetFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      <Select value={filters.sportsbook} onValueChange={(value) => onFilterChange('sportsbook', value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Sportsbook" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sportsbooks</SelectItem>
          {sportsbooks.map((sb) => (
            <SelectItem key={sb.id} value={sb.id}>{sb.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.league} onValueChange={(value) => onFilterChange('league', value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="League" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Leagues</SelectItem>
          {leagues.map((league) => (
            <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.betType} onValueChange={(value) => onFilterChange('betType', value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Bet Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Bet Types</SelectItem>
          {betTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.outcome} onValueChange={(value) => onFilterChange('outcome', value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Outcome" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Outcomes</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="won">Won</SelectItem>
          <SelectItem value="lost">Lost</SelectItem>
          <SelectItem value="push">Push</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={onImport} disabled={isImporting}>
        <Plus className="mr-2 h-4 w-4" />
        {isImporting ? 'Importing...' : 'Import from CSV'}
      </Button>
      <Button variant="outline" onClick={onDownloadTemplate}>
        <Download className="mr-2 h-4 w-4" />
        Template
      </Button>
    </div>
  );
}

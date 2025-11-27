import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BetStats as BetStatsType } from '@/types';

interface BetStatsProps {
  stats: BetStatsType;
}

export function BetStats({ stats }: BetStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Bets</CardDescription>
          <CardTitle className="text-3xl">{stats.totalBets}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Win Rate</CardDescription>
          <CardTitle className="text-3xl">{stats.winRate}%</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total P/L</CardDescription>
          <CardTitle className={`text-3xl ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${stats.totalProfit.toFixed(2)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>ROI</CardDescription>
          <CardTitle className={`text-3xl ${parseFloat(stats.roi) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.roi}%
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Avg EV%</CardDescription>
          <CardTitle className={`text-3xl ${parseFloat(stats.avgEV) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.avgEV}%
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Avg CLV%</CardDescription>
          <CardTitle className={`text-3xl ${parseFloat(stats.avgCLV) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.avgCLV}%
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

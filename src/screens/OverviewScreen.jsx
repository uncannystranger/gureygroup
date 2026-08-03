import React from 'react';
import TotalBalanceCapsule from '../components/TotalBalanceCapsule';
import ExpenseStatisticChart from '../components/ExpenseStatisticChart';
import FinancialHealthGraph from '../components/FinancialHealthGraph';
import UpcomingPaymentsTable from '../components/UpcomingPaymentsTable';
import TransactionsPanel from '../components/TransactionsPanel';
import QuickTransferWidget from '../components/QuickTransferWidget';

export default function OverviewScreen({ onOpenSendModal, onViewAllTransactions }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      
      {/* Primary Main Content Area (8 Columns on Desktop) */}
      <div className="xl:col-span-8 flex flex-col space-y-6">
        
        {/* Total Balance Connected Capsule Card */}
        <TotalBalanceCapsule onOpenSendModal={onOpenSendModal} />

        {/* Middle Grid Row: Expense Statistic & Financial Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExpenseStatisticChart />
          <FinancialHealthGraph />
        </div>

        {/* Upcoming Payments Table Card */}
        <UpcomingPaymentsTable onViewAll={onViewAllTransactions} />

      </div>

      {/* Right Information Panel (4 Columns on Desktop) */}
      <div className="xl:col-span-4 flex flex-col space-y-6">
        
        {/* Recent Transactions List */}
        <TransactionsPanel onViewAll={onViewAllTransactions} />

        {/* Quick Transfer Card */}
        <QuickTransferWidget onOpenSendModal={onOpenSendModal} />

      </div>

    </div>
  );
}

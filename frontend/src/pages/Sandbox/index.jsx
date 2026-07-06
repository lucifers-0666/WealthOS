import React, { useEffect } from 'react';
import { useSandboxStore } from '../../store/sandboxStore';
import SandboxHeader from './components/SandboxHeader';
import TabBar from './components/TabBar';
import EquityDesk from './components/equity/EquityDesk';
import OptionsDesk from './components/options/OptionsDesk';
import FuturesDesk from './components/futures/FuturesDesk';
import OrdersHistory from './components/OrdersHistory';
import SandboxRulesHub from './components/SandboxRulesHub';
import StrategyLab from './components/StrategyLab';
import Leaderboard from './components/Leaderboard';
import { ChartLineUp, Strategy, ClockCounterClockwise, ListDashes, BookOpen, Flask, Trophy } from '@phosphor-icons/react';

export default function Sandbox() {
  const { loadWallet, activeTab } = useSandboxStore(state => state.actions);
  const currentTab = useSandboxStore(state => state.activeTab);

  useEffect(() => {
    loadWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sandbox-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SandboxHeader />
      
      <div className="sandbox-card" style={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <TabBar 
          tabs={[
            { id: 'equity', label: 'Paper Equity', icon: <ChartLineUp size={16} /> },
            { id: 'options', label: 'Options Desk', icon: <Strategy size={16} /> },
            { id: 'futures', label: 'Futures Desk', icon: <ClockCounterClockwise size={16} /> },
            { id: 'strategies', label: 'Strategy Lab', icon: <Flask size={16} /> },
            { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={16} /> },
            { id: 'orders', label: 'Order History', icon: <ListDashes size={16} /> },
            { id: 'rules', label: 'Academy & Rules', icon: <BookOpen size={16} /> }
          ]} 
          activeTab={currentTab} 
          onChange={(id) => useSandboxStore.getState().setActiveTab(id)} 
        />
        
        <div className="sandbox-content" style={{ padding: '24px' }}>
          {currentTab === 'equity' && <EquityDesk />}
          {currentTab === 'options' && <OptionsDesk />}
          {currentTab === 'futures' && <FuturesDesk />}
          {currentTab === 'strategies' && <StrategyLab />}
          {currentTab === 'leaderboard' && <Leaderboard />}
          {currentTab === 'orders' && <OrdersHistory />}
          {currentTab === 'rules' && <SandboxRulesHub />}
        </div>
      </div>
    </div>
  );
}

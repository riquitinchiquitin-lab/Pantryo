import React, { useState } from 'react';
import { Users, Copy, Check, Shield, Clock, Plus, UserCheck, ArrowRightLeft } from 'lucide-react';
import { User, ActivityLogItem } from '../types';

interface FamilySyncViewProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  members: User[];
}

export const FamilySyncView: React.FC<FamilySyncViewProps> = ({
  currentUser,
  onSwitchUser,
  members,
}) => {
  const [copied, setCopied] = useState(false);
  const inviteCode = 'KOMRADE-7729';

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activityAudit: ActivityLogItem[] = [
    {
      id: 'log_3',
      action: 'ITEM_DEFROSTED',
      details: { itemName: 'Grass-Fed Ground Beef', fromLocation: 'Freezer', toLocation: 'Fridge', newExpiration: '3 days', defrostedBy: 'Yan' },
      userId: 'usr_yan',
      householdId: 'hh_01',
      createdAt: '12 minutes ago',
    },
    {
      id: 'log_2',
      action: 'ITEM_CREATED',
      details: { itemName: 'Organic Strawberries', location: 'Fridge', addedBy: 'Kriz' },
      userId: 'usr_kriz',
      householdId: 'hh_01',
      createdAt: '3 hours ago',
    },
    {
      id: 'log_1',
      action: 'ITEM_CREATED',
      details: { itemName: 'Oat Milk (Barista Blend)', location: 'Fridge', addedBy: 'Yan' },
      userId: 'usr_yan',
      householdId: 'hh_01',
      createdAt: 'Yesterday',
    },
  ];

  return (
    <div className="space-y-5 pb-20 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#233527]">Family Sync & Household</h2>
        <p className="text-xs text-[#5D7060]">Multi-tenant access for roommates and families</p>
      </div>

      {/* Household Invite Box */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#EBF3E8] to-[#DEF0DC] border border-[#BFDEBA] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>The Yan & Kriz Kitchen</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">
            Active Household
          </span>
        </div>

        <p className="text-xs text-[#425E45] leading-relaxed">
          Share this invite code with family members or roommates so they can scan items, receive expiration alerts, and manage fridge items together.
        </p>

        <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur rounded-2xl border border-emerald-200">
          <div className="flex-1 font-mono font-bold text-center tracking-wider text-emerald-900 text-sm">
            {inviteCode}
          </div>
          <button
            onClick={copyInvite}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Switch Active User / Simulator Switcher */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D7060]">
            Household Members ({members.length})
          </h3>
          <span className="text-[11px] text-[#69856C]">Tap to switch active profile</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {members.map((member) => {
            const isActive = member.id === currentUser.id;
            return (
              <button
                key={member.id}
                onClick={() => onSwitchUser(member)}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  isActive
                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-[#F2F6F0] border-[#D9E4D6] hover:bg-white hover:border-slate-300'
                }`}
              >
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#233527] truncate">{member.name}</span>
                    {isActive && <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-[#6C8470] capitalize">{member.role.toLowerCase()}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Household Audit Activity Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5D7060]">
          <Clock className="w-3.5 h-3.5" />
          <span>Real-Time Audit Activity</span>
        </div>

        <div className="space-y-2.5">
          {activityAudit.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-white border border-[#D5E1D2] text-xs space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#233527]">
                  {log.details.itemName}
                </span>
                <span className="text-[11px] text-[#7B947E]">{log.createdAt}</span>
              </div>
              <p className="text-[#59725C]">
                {log.action === 'ITEM_DEFROSTED' ? (
                  <>Defrosted by <strong>{log.details.defrostedBy}</strong> (moved from Freezer ➡️ Fridge with 3 days shelf-life)</>
                ) : (
                  <>Added to {log.details.location} by <strong>{log.details.addedBy}</strong></>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

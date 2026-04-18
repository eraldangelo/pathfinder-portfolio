import React from 'react';
import Image from 'next/image';
import type { ApplicationInfo, ApplicationStatus } from '../../../data/applications';
import { useTranslation } from '../../../contexts/LanguageContext';
import { IMAGE_LINKS } from '@/config/imageLinks';

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


const ApplicationStatusBar: React.FC<{ application: ApplicationInfo }> = ({ application }) => {
    const { t } = useTranslation();

    const NODE_DEFINITIONS: { id: string; label: string; statuses: ApplicationStatus[]; x: number; y: number; nodeIndex: number; }[] = [
        { id: 'submitted', label: t('submittedApplicationNode'), statuses: ['Submitted', 'Submitted Application'], x: 100, y: 220, nodeIndex: 1 },
        { id: 'more_info', label: t('moreInformationRequiredNode'), statuses: ['More Information Required'], x: 250, y: 220, nodeIndex: 2 },
        { id: 'conditional', label: t('conditionalOfferNode'), statuses: ['Conditional Offer'], x: 400, y: 120, nodeIndex: 3 },
        { id: 'unconditional', label: t('unconditionalOfferNode'), statuses: ['Unconditional Offer'], x: 400, y: 220, nodeIndex: 4 },
        { id: 'payment', label: t('paymentProcessedNode'), statuses: ['Payment Processed'], x: 550, y: 220, nodeIndex: 5 },
        { id: 'coe', label: t('coeReceivedNode'), statuses: ['CoE/LoA Received'], x: 700, y: 220, nodeIndex: 6 },
        { id: 'lodged', label: t('visaLodgedNode'), statuses: ['Visa Lodged'], x: 850, y: 220, nodeIndex: 7 },
        { id: 'granted', label: t('visaGrantedNode'), statuses: ['Visa Granted'], x: 1025, y: 220, nodeIndex: 8 },
        { id: 'orientation', label: t('preDepartureOrientationNode'), statuses: ['Pre-Departure Orientation'], x: 1175, y: 220, nodeIndex: 9 },
        { id: 'refused', label: t('withdrawnRejectedRefusedNode'), statuses: ['Visa Refused', 'Visa Withdrawn', 'Withdrawn', 'Application Rejected'], x: 1025, y: 320, nodeIndex: 10 },
        { id: 'refund', label: t('refundProcessingNode'), statuses: ['Refund Processing'], x: 1175, y: 320, nodeIndex: 11 },
        { id: 'end', label: t('endApplicationNode'), statuses: ['Application Ended'], x: 1350, y: 270, nodeIndex: 12 },
    ];

    const CONNECTIONS = [
        { from: 'submitted', to: 'more_info' },
        { from: 'more_info', to: 'unconditional' },
        { from: 'more_info', to: 'conditional' },
        { from: 'conditional', to: 'unconditional', dashed: true },
        { from: 'unconditional', to: 'payment' },
        { from: 'payment', to: 'coe' },
        { from: 'coe', to: 'lodged' },
        { from: 'lodged', to: 'granted' },
        { from: 'lodged', to: 'refused' },
        { from: 'granted', to: 'orientation' },
        { from: 'refused', to: 'refund' },
        { from: 'orientation', to: 'end' },
        { from: 'refund', to: 'end' },
        { from: 'refused', to: 'end', dashed: true },
    ];

    const statusToNodeIdMap = new Map<ApplicationStatus, string>();
    NODE_DEFINITIONS.forEach(node => {
        node.statuses.forEach(status => {
            statusToNodeIdMap.set(status, node.id);
        });
    });
    
    const historyStatuses = new Set(application.history.map(h => h.status));
    const currentNodeId = statusToNodeIdMap.get(application.status);
    
    const activeNodeIds = new Set<string>();
    NODE_DEFINITIONS.forEach(node => {
        if (node.statuses.some(s => historyStatuses.has(s))) {
            activeNodeIds.add(node.id);
        }
    });
    if (currentNodeId) {
        activeNodeIds.add(currentNodeId);
    }
    
    const currentNode = NODE_DEFINITIONS.find(n => n.id === currentNodeId);
    const getNode = (id: string) => NODE_DEFINITIONS.find(n => n.id === id)!;

    const SVG_WIDTH = 1500;
    const SVG_HEIGHT = 400;

    const runnerX = currentNode ? (currentNode.x / SVG_WIDTH) * 100 : -100;
    const runnerY = currentNode ? (currentNode.y / SVG_HEIGHT) * 100 : -100;

    return (
        <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10 mb-6">
            <h3 className="text-lg font-semibold text-[#004097] dark:text-blue-300 mb-4 sm:mb-6">{t('applicationProgress')}</h3>
            
            <div className="overflow-x-auto custom-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
                <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[400px] min-w-[1100px] xl:min-w-[1500px]">
                    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="absolute inset-0">
                        {CONNECTIONS.map(({ from, to, dashed }) => {
                            const fromNode = getNode(from);
                            const toNode = getNode(to);
                            const isActive = activeNodeIds.has(fromNode.id) && activeNodeIds.has(toNode.id);
                            return (
                                <line
                                    key={`${from}-${to}`}
                                    x1={fromNode.x} y1={fromNode.y}
                                    x2={toNode.x} y2={toNode.y}
                                    className={`transition-all duration-500 ${isActive ? 'stroke-red-500' : 'stroke-gray-300 dark:stroke-gray-600'}`}
                                    strokeWidth="3"
                                    strokeDasharray={dashed ? '6 6' : 'none'}
                                />
                            );
                        })}
                    </svg>
                    
                    {NODE_DEFINITIONS.map((node) => {
                        const isCurrent = node.id === currentNodeId;
                        const isCompleted = activeNodeIds.has(node.id) && !isCurrent;
                        
                        let circleClass = 'bg-gray-400 dark:bg-gray-500 text-gray-800 dark:text-gray-300';
                        let textClass = 'text-gray-500 dark:text-gray-400';
                        
                        if (isCompleted) {
                            circleClass = 'bg-green-500 text-white';
                            textClass = 'text-gray-700 dark:text-gray-200 font-semibold';
                        }
                        if (isCurrent) {
                            circleClass = 'bg-blue-500 text-white';
                            textClass = 'text-gray-800 dark:text-white font-bold';
                        }

                        return (
                            <div 
                                key={node.id} 
                                className="absolute flex flex-col items-center"
                                style={{
                                    left: `${(node.x / SVG_WIDTH) * 100}%`,
                                    top: `${(node.y / SVG_HEIGHT) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <div className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${circleClass}`}>
                                    {isCurrent && <div className="absolute inset-0 rounded-full bg-blue-500/20 scale-150" />}
                                    {isCompleted 
                                        ? <CheckIcon />
                                        : <span className="font-semibold text-sm">{node.nodeIndex}</span>
                                    }
                                </div>
                                <div className={`mt-2 text-center text-sm leading-tight whitespace-pre-wrap transition-all duration-300 ${textClass}`}>
                                    {node.label}
                                </div>
                            </div>
                        );
                    })}

                    {currentNode && (
                        <div
                            className="absolute top-0 left-0 transition-all duration-1000 ease-in-out pointer-events-none"
                            style={{
                                top: `${runnerY}%`,
                                left: `${runnerX}%`,
                                transform: 'translate(-50%, -86%)',
                            }}
                        >
                            <Image
                                src={IMAGE_LINKS.ui.applicationStatusRunner}
                                alt="Current status marker"
                                width={56}
                                height={56}
                                className="w-14 h-14 object-contain drop-shadow-md"
                                unoptimized
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicationStatusBar;


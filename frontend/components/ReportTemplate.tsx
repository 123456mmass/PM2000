import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ReportTemplateProps {
    markdownContent: string;
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ markdownContent }) => {
    return (
        <div
            style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '25mm',
                backgroundColor: 'white',
                color: '#1e293b',
                fontFamily: '"Sarabun", "Inter", -apple-system, sans-serif',
                position: 'relative',
                lineHeight: '1.6',
            }}
        >
            {/* Professional Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '3px solid #1e40af',
                paddingBottom: '20px',
                marginBottom: '30px'
            }}>
                <div>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: '#1e40af',
                        color: 'white',
                        padding: '4px 12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Power Quality Insight
                    </div>
                    <h1 style={{ color: '#0f172a', margin: 0, fontSize: '28px', fontWeight: '800' }}>
                        PM2230 Dashboard
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
                        Autonomous AI Engineering Analysis Report
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginBottom: '4px',
                        fontWeight: '600'
                    }}>
                        GENERATED ON
                    </div>
                    <div style={{
                        fontSize: '16px',
                        color: '#1e293b',
                        fontWeight: '700'
                    }}>
                        {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div
                className="report-content"
                style={{
                    fontSize: '14px',
                }}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        h1: ({ node, ...props }: any) => (
                            <h1 style={{
                                color: '#1e40af',
                                fontSize: '22px',
                                marginTop: '24px',
                                marginBottom: '12px',
                                fontWeight: '700',
                                borderLeft: '5px solid #1e40af',
                                paddingLeft: '12px'
                            }} {...props} />
                        ),
                        h2: ({ node, ...props }: any) => (
                            <h2 style={{
                                color: '#1d4ed8',
                                fontSize: '19px',
                                marginTop: '20px',
                                marginBottom: '10px',
                                fontWeight: '700',
                                backgroundColor: '#eff6ff',
                                padding: '8px 12px',
                                borderRadius: '6px'
                            }} {...props} />
                        ),
                        h3: ({ node, ...props }: any) => (
                            <h3 style={{
                                color: '#0369a1',
                                fontSize: '17px',
                                marginTop: '16px',
                                marginBottom: '8px',
                                fontWeight: '600'
                            }} {...props} />
                        ),
                        p: ({ node, ...props }: any) => (
                            <p style={{ marginBottom: '12px', color: '#334155' }} {...props} />
                        ),
                        table: ({ node, ...props }: any) => (
                            <div style={{ margin: '16px 0', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} />
                            </div>
                        ),
                        thead: ({ node, ...props }: any) => (
                            <thead style={{ backgroundColor: '#f8fafc' }} {...props} />
                        ),
                        th: ({ node, ...props }: any) => (
                            <th style={{
                                borderBottom: '2px solid #e2e8f0',
                                borderRight: '1px solid #f1f5f9',
                                padding: '12px 16px',
                                color: '#475569',
                                fontWeight: '700',
                                textAlign: 'left',
                                fontSize: '12px',
                                textTransform: 'uppercase'
                            }} {...props} />
                        ),
                        td: ({ node, ...props }: any) => (
                            <td style={{
                                borderBottom: '1px solid #f1f5f9',
                                borderRight: '1px solid #f1f5f9',
                                padding: '10px 16px',
                                color: '#1e293b'
                            }} {...props} />
                        ),
                        ul: ({ node, ...props }: any) => (
                            <ul style={{ paddingLeft: '24px', marginBottom: '16px', color: '#334155' }} {...props} />
                        ),
                        li: ({ node, ...props }: any) => (
                            <li style={{ marginBottom: '6px' }} {...props} />
                        ),
                        strong: ({ node, ...props }: any) => (
                            <strong style={{ fontWeight: '700', color: '#0f172a' }} {...props} />
                        ),
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>

            {/* Professional Footer */}
            <div style={{
                marginTop: '60px',
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#94a3b8',
                fontSize: '11px'
            }}>
                <div>
                    <p style={{ margin: 0 }}>© {new Date().getFullYear()} • กลุ่ม 2 เฉลียว</p>
                    <p style={{ margin: '2px 0 0 0' }}>Electrical Power Quality Monitoring Project</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#64748b' }}>CONFIDENTIAL ENGINEERING DOCUMENT</p>
                    <p style={{ margin: '2px 0 0 0' }}>Powered by Qwen 3.5 Plus Analysis Engine</p>
                </div>
            </div>
        </div>
    );
};

export default ReportTemplate;

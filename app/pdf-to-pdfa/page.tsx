import { RoadmapRemainingPage } from '@/components/RoadmapRemainingPage';

const dedupeTitleCss = `
  .platform-task-workspace .rr-head .rr-icon,
  .platform-task-workspace .rr-head .rr-title strong {
    display: none !important;
  }
  .platform-task-workspace .rr-head,
  .platform-task-workspace .rr-title {
    display: block !important;
  }
  .platform-task-workspace .rr-title span {
    margin-top: 0 !important;
  }
`;

export default function Page() {
  return (
    <>
      <style>{dedupeTitleCss}</style>
      <RoadmapRemainingPage route="/pdf-to-pdfa" mode="pdf-to-pdfa" />
    </>
  );
}

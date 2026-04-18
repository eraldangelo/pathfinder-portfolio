import RequestOffsetModal, { type RequestOffsetModalProps } from './RequestOffsetModal';

type RequestUseOffsetModalProps = Omit<RequestOffsetModalProps, 'titleKey' | 'mode'>;

const RequestUseOffsetModal: React.FC<RequestUseOffsetModalProps> = (props) => (
    <RequestOffsetModal
        {...props}
        titleKey="requestOffsetUseTitle"
        messageKey="requestOffsetUseMessage"
        reasonLabelKey="reason"
        reasonPlaceholderKey="requestOffsetUseReasonPlaceholder"
        mode="use"
    />
);

export default RequestUseOffsetModal;

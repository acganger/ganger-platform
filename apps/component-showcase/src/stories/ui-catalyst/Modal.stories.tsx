import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalLegacy, Button } from '@ganger/ui-catalyst';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: '@ganger/ui-catalyst/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst modal component with enhanced animations and styling.',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size of the modal',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Close modal when clicking overlay',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const ModalDemo = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button color="blue" onClick={() => setIsOpen(true)}>
            Open Catalyst Modal
          </Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <ModalHeader>Modal Title</ModalHeader>
            <ModalContent>
              <p>This is a modern Catalyst modal with enhanced styling and animations.</p>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button color="blue" onClick={() => setIsOpen(false)}>
                Confirm
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };
    
    return <ModalDemo />;
  },
};

export const Sizes: Story = {
  render: () => {
    const SizesDemo = () => {
      const [openModal, setOpenModal] = useState<string | null>(null);
      const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
      
      return (
        <>
          <div className="flex gap-2 flex-wrap">
            {sizes.map(size => (
              <Button key={size} variant="outline" onClick={() => setOpenModal(size)}>
                {size} Modal
              </Button>
            ))}
          </div>
          
          {sizes.map(size => (
            <Modal
              key={size}
              isOpen={openModal === size}
              onClose={() => setOpenModal(null)}
              size={size}
            >
              <ModalHeader>Size: {size}</ModalHeader>
              <ModalContent>
                <p>This is a {size} sized Catalyst modal.</p>
                {size === 'full' && (
                  <p className="mt-2">Full screen modals are great for complex forms or detailed views.</p>
                )}
              </ModalContent>
              <ModalFooter>
                <Button color="blue" onClick={() => setOpenModal(null)}>Close</Button>
              </ModalFooter>
            </Modal>
          ))}
        </>
      );
    };
    
    return <SizesDemo />;
  },
};

export const LegacyComparison: Story = {
  render: () => {
    const ComparisonDemo = () => {
      const [modernOpen, setModernOpen] = useState(false);
      const [legacyOpen, setLegacyOpen] = useState(false);
      
      return (
        <>
          <div className="flex gap-4">
            <Button color="blue" onClick={() => setModernOpen(true)}>
              Open Modern Modal
            </Button>
            <Button variant="outline" onClick={() => setLegacyOpen(true)}>
              Open Legacy Modal
            </Button>
          </div>
          
          <Modal isOpen={modernOpen} onClose={() => setModernOpen(false)}>
            <ModalHeader>Modern Catalyst Modal</ModalHeader>
            <ModalContent>
              <p>Features enhanced animations, better shadows, and improved dark mode support.</p>
            </ModalContent>
            <ModalFooter>
              <Button color="blue" onClick={() => setModernOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </Modal>
          
          <ModalLegacy isOpen={legacyOpen} onClose={() => setLegacyOpen(false)}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Legacy Modal</h2>
              <p>Traditional modal styling with standard animations.</p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="px-4 py-2 border rounded hover:bg-neutral-100"
                  onClick={() => setLegacyOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </ModalLegacy>
        </>
      );
    };
    
    return <ComparisonDemo />;
  },
};

export const FormModal: Story = {
  render: () => {
    const FormModalDemo = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button color="green" onClick={() => setIsOpen(true)}>
            Add New Patient
          </Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
            <ModalHeader>New Patient Registration</ModalHeader>
            <ModalContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input type="text" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input type="text" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input type="date" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Medical History</label>
                  <textarea className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500" rows={3} />
                </div>
              </form>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button color="green" onClick={() => setIsOpen(false)}>
                Save Patient
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };
    
    return <FormModalDemo />;
  },
};

export const ConfirmationModal: Story = {
  render: () => {
    const ConfirmDemo = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button color="red" onClick={() => setIsOpen(true)}>
            Delete Record
          </Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalContent>
              <div className="text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-lg font-semibold mb-2">Are you sure?</p>
                <p className="text-sm text-neutral-600">
                  This action cannot be undone. The record will be permanently deleted.
                </p>
              </div>
            </ModalContent>
            <ModalFooter className="justify-center">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button color="red" onClick={() => setIsOpen(false)}>
                Delete
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };
    
    return <ConfirmDemo />;
  },
};

export const ScrollableContent: Story = {
  render: () => {
    const ScrollableDemo = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button onClick={() => setIsOpen(true)}>
            View Terms
          </Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
            <ModalHeader>Terms and Conditions</ModalHeader>
            <ModalContent>
              <div className="max-h-96 overflow-y-auto">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="mb-4">
                    <h3 className="font-semibold mb-2">Section {i + 1}</h3>
                    <p className="text-sm text-neutral-600">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                      nisi ut aliquip ex ea commodo consequat.
                    </p>
                  </div>
                ))}
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Decline
              </Button>
              <Button color="blue" onClick={() => setIsOpen(false)}>
                Accept
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };
    
    return <ScrollableDemo />;
  },
};
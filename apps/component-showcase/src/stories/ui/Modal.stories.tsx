import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalHeader, ModalContent, ModalFooter, Button } from '@ganger/ui';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: '@ganger/ui/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal component with composable parts for dialogs and overlays.',
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
    closeOnEsc: {
      control: 'boolean',
      description: 'Close modal when pressing Escape',
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
          <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <ModalHeader>Modal Title</ModalHeader>
            <ModalContent>
              <p>This is the modal content. You can put any content here.</p>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
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
              <Button key={size} onClick={() => setOpenModal(size)}>
                Open {size} Modal
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
              <ModalHeader>Modal Size: {size}</ModalHeader>
              <ModalContent>
                <p>This is a {size} sized modal.</p>
              </ModalContent>
              <ModalFooter>
                <Button onClick={() => setOpenModal(null)}>Close</Button>
              </ModalFooter>
            </Modal>
          ))}
        </>
      );
    };
    
    return <SizesDemo />;
  },
};

export const WithForm: Story = {
  render: () => {
    const FormModal = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button onClick={() => setIsOpen(true)}>Add New Patient</Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
            <ModalHeader>New Patient Registration</ModalHeader>
            <ModalContent>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input type="date" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded" />
                </div>
              </form>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Save Patient
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };
    
    return <FormModal />;
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const ConfirmDialog = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button variant="danger" onClick={() => setIsOpen(true)}>
            Delete Record
          </Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalContent>
              <p>Are you sure you want to delete this record?</p>
              <p className="text-sm text-neutral-600 mt-2">
                This action cannot be undone.
              </p>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setIsOpen(false)}>
                Delete
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };
    
    return <ConfirmDialog />;
  },
};

export const LongContent: Story = {
  render: () => {
    const LongContentModal = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button onClick={() => setIsOpen(true)}>View Terms</Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
            <ModalHeader>Terms and Conditions</ModalHeader>
            <ModalContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {[...Array(10)].map((_, i) => (
                  <div key={i}>
                    <h3 className="font-semibold mb-2">Section {i + 1}</h3>
                    <p className="text-sm text-neutral-600">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                    </p>
                  </div>
                ))}
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Decline
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Accept
              </Button>
            </ModalFooter>
          </Modal>
        </>
      );
    };
    
    return <LongContentModal />;
  },
};

export const NoFooter: Story = {
  render: () => {
    const NoFooterModal = () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <>
          <Button onClick={() => setIsOpen(true)}>View Info</Button>
          
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <ModalHeader>Information</ModalHeader>
            <ModalContent>
              <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded">
                <p className="text-cyan-800 dark:text-cyan-200">
                  This is an informational modal without footer buttons.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 text-cyan-600 hover:underline"
              >
                Got it, thanks!
              </button>
            </ModalContent>
          </Modal>
        </>
      );
    };
    
    return <NoFooterModal />;
  },
};
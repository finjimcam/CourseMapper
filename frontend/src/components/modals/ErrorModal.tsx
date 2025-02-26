/*
Source code for LISU CCM @UofG
Copyright (C) 2025 Maxine Armstrong, Ibrahim Asghar, Finlay Cameron, Colin Nardo, Rachel Horton, Qikai Zhou

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program at /LICENSE.md. If not, see <https://www.gnu.org/licenses/>.
*/

// src/components/ErrorModal.tsx
import React from 'react';
import { Modal, Button } from 'flowbite-react';

interface ErrorModalProps {
  show: boolean;
  /** Title of the modal. Default is "Errors" */
  title?: string;
  /** An optional message to display above the error list */
  message?: string;
  /** An array of error messages to display */
  errors: string[];
  /** Callback when the modal is closed */
  onClose: () => void;
  /** Text to show on the close button */
  buttonText?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  show,
  title = 'Errors',
  message = 'Please fix the following issues:',
  errors,
  onClose,
  buttonText = 'Close',
}) => (
  <Modal show={show} onClose={onClose}>
    <Modal.Header>{title}</Modal.Header>
    <Modal.Body>
      <div className="space-y-2">
        <p className="text-red-500 font-medium">{message}</p>
        <ul className="list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-gray-700">
              {error}
            </li>
          ))}
        </ul>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onClose}>{buttonText}</Button>
    </Modal.Footer>
  </Modal>
);

export default ErrorModal;

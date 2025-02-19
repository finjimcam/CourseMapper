// src/components/ActivityModal.tsx
import React from "react";
import { Modal, Button, Label, TextInput, Select } from "flowbite-react";
import { Activity, GenericData } from "../../utils/workbookUtils";

interface ActivityModalProps {
  show: boolean;
  activity: Partial<Activity>;
  editing: boolean;
  locations: GenericData[];
  learningActivities: GenericData[];
  learningTypes: GenericData[];
  taskStatuses: GenericData[];
  users: GenericData[];
  onSave: () => void;
  onCancel: () => void;
  onFieldChange: (field: string, value: string | number) => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  show,
  activity,
  editing,
  locations,
  learningActivities,
  learningTypes,
  taskStatuses,
  users,
  onSave,
  onCancel,
  onFieldChange
}) => (
  <Modal show={show} onClose={onCancel}>
    <Modal.Header>{editing ? "Edit Activity" : "Add New Activity"}</Modal.Header>
    <Modal.Body>
      <div className="space-y-4">
        <div>
          <Label htmlFor="activityName" value="Activity Name" />
          <TextInput
            id="activityName"
            value={activity.name || ""}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="timeEstimate" value="Time Estimate (minutes)" />
          <TextInput
            id="timeEstimate"
            type="number"
            value={activity.time_estimate_minutes || ""}
            onChange={(e) => onFieldChange("time_estimate_minutes", parseInt(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="location" value="Location" />
          <Select
            id="location"
            value={activity.location_id || ""}
            onChange={(e) => onFieldChange("location_id", e.target.value)}
          >
            <option value="">Select location</option>
            {locations.map((loc: GenericData) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="learningActivity" value="Learning Activity" />
          <Select
            id="learningActivity"
            value={activity.learning_activity_id || ""}
            onChange={(e) => onFieldChange("learning_activity_id", e.target.value)}
          >
            <option value="">Select learning activity</option>
            {learningActivities.map((act: GenericData) => (
              <option key={act.id} value={act.id}>
                {act.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="learningType" value="Learning Type" />
          <Select
            id="learningType"
            value={activity.learning_type_id || ""}
            onChange={(e) => onFieldChange("learning_type_id", e.target.value)}
          >
            <option value="">Select learning type</option>
            {learningTypes.map((type: GenericData) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="taskStatus" value="Task Status" />
          <Select
            id="taskStatus"
            value={activity.task_status_id || ""}
            onChange={(e) => onFieldChange("task_status_id", e.target.value)}
          >
            <option value="">Select status</option>
            {taskStatuses.map((status: GenericData) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="staff" value="Staff Member Responsible" />
          <Select
            id="staff"
            value={activity.staff_id || ""}
            onChange={(e) => onFieldChange("staff_id", e.target.value)}
          >
            <option value="">Select staff member</option>
            {users.map((user: GenericData) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onSave}>{editing ? "Save Changes" : "Add Activity"}</Button>
      <Button color="gray" onClick={onCancel}>
        Cancel
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ActivityModal;

'use client'

import { useState } from 'react'
import { Badge, Button } from '@ganger/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@ganger/ui-catalyst'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  BeakerIcon,
  HeartIcon,
  ScissorsIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

interface Department {
  id: string
  name: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description: string
  commonOrders: string[]
}

interface DepartmentSelectorProps {
  selectedDepartment?: string
  onSelectDepartment: (departmentId: string) => void
  showQuickActions?: boolean
  onQuickAction?: (action: string) => void
}

const departments: Department[] = [
  {
    id: 'clinical',
    name: 'Clinical',
    icon: HeartIcon,
    description: 'Exam rooms, nursing stations',
    commonOrders: ['Gloves', 'Gauze', 'Syringes', 'Alcohol prep pads']
  },
  {
    id: 'surgical',
    name: 'Surgical',
    icon: ScissorsIcon,
    description: 'Procedure rooms, surgical suites',
    commonOrders: ['Surgical gloves', 'Sutures', 'Sterile drapes', 'Blades']
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    icon: BeakerIcon,
    description: 'Lab testing, specimen processing',
    commonOrders: ['Test tubes', 'Slides', 'Lab gloves', 'Specimen containers']
  },
  {
    id: 'aesthetics',
    name: 'Aesthetics',
    icon: CameraIcon,
    description: 'Cosmetic procedures, laser treatments',
    commonOrders: ['Needles', 'Numbing cream', 'Post-care products', 'Gloves']
  },
  {
    id: 'administrative',
    name: 'Administrative',
    icon: BuildingOfficeIcon,
    description: 'Front desk, billing, management',
    commonOrders: ['Paper products', 'Sanitizers', 'Office supplies']
  },
  {
    id: 'all',
    name: 'All Departments',
    icon: UserGroupIcon,
    description: 'General supplies for all areas',
    commonOrders: ['Common supplies used across departments']
  }
]

export function DepartmentSelector({
  selectedDepartment,
  onSelectDepartment,
  showQuickActions = true,
  onQuickAction
}: DepartmentSelectorProps) {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null)
  
  const currentDept = departments.find(d => d.id === selectedDepartment) || departments[5]

  return (
    <div className="space-y-6">
      {/* Department Grid */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Your Department</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {departments.map((dept) => {
            const Icon = dept.icon
            const isSelected = dept.id === selectedDepartment
            
            return (
              <Card
                key={dept.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary-500 bg-primary-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => onSelectDepartment(dept.id)}
                onMouseEnter={() => setHoveredDept(dept.id)}
                onMouseLeave={() => setHoveredDept(null)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full ${
                      isSelected ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isSelected ? 'text-primary-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{dept.description}</p>
                    {isSelected && (
                      <Badge variant="primary" className="text-xs">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && selectedDepartment && selectedDepartment !== 'all' && currentDept && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <currentDept.icon className="h-5 w-5" />
              <span>{currentDept.name} Quick Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Common items ordered by {currentDept.name} department:
            </p>
            <div className="flex flex-wrap gap-2">
              {currentDept.commonOrders.map((item, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  onClick={() => onQuickAction?.(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Info */}
      {hoveredDept && hoveredDept !== selectedDepartment && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Tip:</span> Select the department that best matches where 
            these supplies will be used. This helps us suggest the right products and quantities.
          </p>
        </div>
      )}
    </div>
  )
}
import type { FC } from "react";
import { observer } from "mobx-react";
import { BarChart3, LineChart, AreaChart, PieChart, Hash } from "lucide-react";
import { EModalPosition, EModalWidth, ModalCore, Button } from "@plane/ui";
import type { TWidgetType } from "@plane/types";

type TWidgetLibraryModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  onSelectWidget: (widgetType: TWidgetType) => void;
};

const WIDGET_LIBRARY: Array<{
  type: TWidgetType;
  name: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    type: "bar",
    name: "Bar Chart",
    description: "Compare quantities across categories",
    icon: <BarChart3 className="h-8 w-8" />,
  },
  {
    type: "line",
    name: "Line Chart",
    description: "Track trends over time",
    icon: <LineChart className="h-8 w-8" />,
  },
  {
    type: "area",
    name: "Area Chart",
    description: "Visualize volume changes over time",
    icon: <AreaChart className="h-8 w-8" />,
  },
  {
    type: "donut",
    name: "Donut Chart",
    description: "Show proportions of a whole",
    icon: <PieChart className="h-8 w-8" />,
  },
  {
    type: "pie",
    name: "Pie Chart",
    description: "Display proportional data",
    icon: <PieChart className="h-8 w-8" />,
  },
  {
    type: "number",
    name: "Number Widget",
    description: "Display a single KPI metric",
    icon: <Hash className="h-8 w-8" />,
  },
];

export const WidgetLibraryModal: FC<TWidgetLibraryModalProps> = observer((props) => {
  const { isOpen, handleClose, onSelectWidget } = props;

  const handleSelectWidget = (widgetType: TWidgetType) => {
    onSelectWidget(widgetType);
    handleClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL} position={EModalPosition.CENTER}>
      <div className="space-y-5 p-5">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-custom-text-100">Add Widget</h3>
          <p className="text-sm text-custom-text-200">Choose a widget type to add to your dashboard</p>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WIDGET_LIBRARY.map((widget) => (
            <button
              key={widget.type}
              onClick={() => handleSelectWidget(widget.type)}
              className="group flex flex-col items-center text-center p-6 border border-custom-border-200 rounded-lg hover:bg-custom-background-80 hover:border-custom-primary/50 transition-all"
            >
              <div className="h-16 w-16 rounded-lg bg-custom-primary/10 flex items-center justify-center mb-3 text-custom-primary group-hover:bg-custom-primary/20 transition-colors">
                {widget.icon}
              </div>
              <h4 className="font-semibold text-custom-text-100 mb-1">{widget.name}</h4>
              <p className="text-sm text-custom-text-200">{widget.description}</p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});

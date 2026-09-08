interface TimeDisplayProps {
  value: number;
  label: string;
}

const TimeDisplay = ({ value, label }: TimeDisplayProps) => (
  <div>
    <span className="flex items-center justify-center w-13 h-13 sm:w-16 sm:h-16 px-2 sm:px-4 mb-1.5 sm:mb-2 text-lg sm:text-xl lg:text-2xl font-bold bg-white rounded-xl text-dark shadow-xs border border-gray-2">
      {value < 10 ? `0${value}` : value}
    </span>
    <span className="block text-center text-xs font-semibold text-gray-500">{label}</span>
  </div>
);

export default TimeDisplay;

import re

with open('src/pages/settings/LocationSettings.jsx', 'r') as f:
    content = f.read()

# Update import
content = content.replace(
    "import { motion, AnimatePresence } from 'framer-motion';",
    "import { motion, AnimatePresence, useDragControls } from 'framer-motion';"
)

# Add useDragControls hook inside LocationSelectionModal
hook_str = """function LocationSelectionModal({ currentCountry, currentCity, initialMode = 'country', onSelect, onClose, t, i18n }) {
    const [searchTerm, setSearchTerm] = useState('');"""
new_hook_str = """function LocationSelectionModal({ currentCountry, currentCity, initialMode = 'country', onSelect, onClose, t, i18n }) {
    const dragControls = useDragControls();
    const [searchTerm, setSearchTerm] = useState('');"""
content = content.replace(hook_str, new_hook_str)

# Replace motion.div properties
old_motion_div = """            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="mt-auto h-[90vh] bg-white dark:bg-[#032e18] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >"""
new_motion_div = """            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(e, info) => {
                    if (info.offset.y > 100 || info.velocity.y > 500) {
                        onClose();
                    }
                }}
                className="mt-auto h-[90vh] bg-white dark:bg-[#032e18] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >"""
content = content.replace(old_motion_div, new_motion_div)

# Replace Modal Header
old_modal_header = """                {/* Modal Header */}
                <div className="p-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl sticky top-0 z-10 space-y-4">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto" />"""

new_modal_header = """                {/* Drag Handle */}
                <div 
                    className="w-full pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full pointer-events-none" />
                </div>

                {/* Modal Header */}
                <div className="px-6 pb-4 border-b dark:border-white/5 bg-white/50 dark:bg-[#032e18]/50 backdrop-blur-xl sticky top-0 z-10 space-y-4">"""

content = content.replace(old_modal_header, new_modal_header)

with open('src/pages/settings/LocationSettings.jsx', 'w') as f:
    f.write(content)


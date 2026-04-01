require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
p = Xcodeproj::Project.open(project_path)
target = p.targets.find { |t| t.name == 'IslamiWidgetsExtension' }
verse_file = p.files.find { |f| f.path.include?('EsmaEntry.swift') }
group = verse_file.parent

files_to_add = [
    'VerseLockScreenView.swift'
]

files_to_add.each do |file_name|
    unless group.files.any? { |f| f.path == file_name }
        file_ref = group.new_reference(file_name)
        target.source_build_phase.add_file_reference(file_ref, true)
        puts "Added #{file_name} to IslamiWidgetsExtension"
    end
end

p.save

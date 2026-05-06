import xml.etree.ElementTree as ET
import sys

plist_path = "ios/App/App/Info.plist"

try:
    tree = ET.parse(plist_path)
    root = tree.getroot()
    dict_elem = root.find('dict')
    
    # Check if we already have 4 items
    shortcut_items_array = None
    for i, child in enumerate(dict_elem):
        if child.tag == 'key' and child.text == 'UIApplicationShortcutItems':
            shortcut_items_array = dict_elem[i+1]
            break
            
    if shortcut_items_array is not None:
        if len(shortcut_items_array.findall('dict')) < 4:
            new_item = ET.fromstring('''
            <dict>
                <key>UIApplicationShortcutItemIconSymbolName</key>
                <string>clock.fill</string>
                <key>UIApplicationShortcutItemTitle</key>
                <string>Namaz Vakitleri</string>
                <key>UIApplicationShortcutItemSubtitle</key>
                <string>Günlük vakitleri hızlıca gör</string>
                <key>UIApplicationShortcutItemType</key>
                <string>com.islamiyoldas.app.times</string>
            </dict>
            ''')
            shortcut_items_array.append(new_item)
            tree.write(plist_path, encoding="UTF-8", xml_declaration=True)
            print("Added 4th item successfully.")
        else:
            print("Already has 4 items.")
    else:
        print("UIApplicationShortcutItems not found!")
except Exception as e:
    print("Error:", e)

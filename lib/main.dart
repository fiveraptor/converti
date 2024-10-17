import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:html' as html;

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Image Converter Online',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  List<Map<String, dynamic>> _selectedFiles = [];
  List<Map<String, dynamic>> _convertedFiles = [];
  String _targetFormat = 'png';
  bool _isConverting = false;
  bool _isMultipleFiles = false;
  double _progress = 0;

  // Dateiauswahl
  void _pickFiles() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.image,
    );

    if (result != null) {
      setState(() {
        _selectedFiles.addAll(result.files.map((file) => {
              'file': file,
              'previewUrl': html.Url.createObjectUrl(html.Blob([file.bytes!])),
            }));
        _isMultipleFiles = _selectedFiles.length > 1;
      });
    }
  }

  // Konvertiere Bilder
  Future<void> convertImages() async {
    setState(() {
      _isConverting = true;
      _convertedFiles.clear();
    });

    var request = http.MultipartRequest(
        'POST', Uri.parse('https://api.converti.bp-web.ch/convert'));

    for (var item in _selectedFiles) {
      var file = item['file'];
      request.files.add(http.MultipartFile.fromBytes(
        'files',
        file.bytes!,
        filename: file.name,
      ));
    }
    request.fields['format'] = _targetFormat;

    var response = await request.send();

    var responseBody = await http.ByteStream(response.stream).toBytes();
    if (response.statusCode == 200) {
      // Für jedes Bild eine URL erstellen
      if (_isMultipleFiles) {
        final blob = html.Blob([responseBody], 'application/zip');
        final url = html.Url.createObjectUrlFromBlob(blob);
        setState(() {
          _convertedFiles.add({'url': url, 'type': 'zip'});
        });
      } else {
        final blob = html.Blob([responseBody], 'image/$_targetFormat');
        final url = html.Url.createObjectUrlFromBlob(blob);
        setState(() {
          _convertedFiles.add({'url': url, 'type': 'single'});
        });
      }

      showSnackbar('Konvertierung erfolgreich. Download bereit.');
    } else {
      showSnackbar('Konvertierung fehlgeschlagen: ${response.statusCode}');
    }

    setState(() {
      _isConverting = false;
      _progress = 0;
    });
  }

  // Download eines Bildes oder ZIP
  void downloadFile(String url, String type) {
    final anchor = html.AnchorElement(href: url)
      ..setAttribute("download", type == 'zip' ? 'converted_files.zip' : 'converted_image.$_targetFormat')
      ..click();
  }

  // Snackbar
  void showSnackbar(String message) {
    final snackBar = SnackBar(content: Text(message));
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  // UI-Aufbau
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Image Converter Online'),
      ),
      body: Center(
        child: Container(
          width: 600, // Setze eine maximale Breite für das Zentrum
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Drag-and-Drop Bereich + Bild-Auswahl
                Container(
                  margin: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(Icons.image, size: 100, color: Colors.grey[400]),
                      SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: _pickFiles,
                        child: Text('Select Images'),
                      ),
                      SizedBox(height: 10),
                      Text('or drag & drop here', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
                // Bildliste
                if (_selectedFiles.isNotEmpty) ...[
                  Container(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      children: [
                        for (var item in _selectedFiles)
                          ListTile(
                            leading: Image.network(
                              item['previewUrl'],
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                            ),
                            title: Text(item['file'].name),
                            subtitle: Text(
                              '${(item['file'].size / 1024).toStringAsFixed(1)} KB',
                            ),
                            trailing: IconButton(
                              icon: Icon(Icons.delete),
                              onPressed: () {
                                setState(() {
                                  _selectedFiles.remove(item);
                                });
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Zielformat auswählen
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Column(
                      children: [
                        DropdownButton<String>(
                          value: _targetFormat,
                          onChanged: (String? newValue) {
                            setState(() {
                              _targetFormat = newValue!;
                            });
                          },
                          items: <String>['png', 'jpg', 'gif'].map<DropdownMenuItem<String>>(
                            (String value) {
                              return DropdownMenuItem<String>(
                                value: value,
                                child: Text(value.toUpperCase()),
                              );
                            },
                          ).toList(),
                        ),
                        SizedBox(height: 10),
                        ElevatedButton(
                          onPressed: convertImages,
                          child: Text('Convert Images'),
                        ),
                      ],
                    ),
                  ),
                ],
                // Fortschrittsanzeige
                if (_isConverting) ...[
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        LinearProgressIndicator(value: _progress),
                        SizedBox(height: 10),
                        Text('Converting images...'),
                      ],
                    ),
                  ),
                ],
                // Anzeige der konvertierten Dateien
                if (_convertedFiles.isNotEmpty) ...[
                  Container(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      children: [
                        for (var file in _convertedFiles)
                          ListTile(
                            leading: Icon(Icons.download),
                            title: Text(file['type'] == 'zip' ? 'Download ZIP' : 'Download Image'),
                            trailing: ElevatedButton(
                              onPressed: () => downloadFile(file['url'], file['type']),
                              child: Text('Download'),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

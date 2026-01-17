
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ProductFormProps {
  product?: any;
  onSave: (product: any) => void;
  onCancel: () => void;
}

export const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    category: product?.category || '',
    value: product?.value || '',
    current_price: product?.current_price || '',
    quantity: product?.quantity || '',
    weight: product?.weight || '1.0',
    dimensions: product?.dimensions || '10x10x10',
    // Book specific
    author: product?.author || '',
    cover_type: product?.cover_type || '',
    publisher: product?.publisher || '',
    publication_date: product?.publication_date || '',
    number_of_pages: product?.number_of_pages || '',
    language: product?.language || '',
    genre: product?.genre || '',
    // CD specific
    artist: product?.artist || '',
    record_label: product?.record_label || '',
    tracklist: product?.tracklist || '',
    release_date: product?.release_date || '',
    // DVD specific
    director: product?.director || '',
    runtime: product?.runtime || '',
    studio: product?.studio || '',
    disc_type: product?.disc_type || '',
    subtitles: product?.subtitles || '',
    // News specific
    editor_in_chief: product?.editor_in_chief || '',
    issue_number: product?.issue_number || '',
    publication_frequency: product?.publication_frequency || '',
    issn: product?.issn || '',
    sections: product?.sections || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate price constraints
    const value = parseFloat(formData.value);
    const price = parseFloat(formData.current_price);
    
    if (price < value * 0.3 || price > value * 1.5) {
      alert('Price must be between 30% and 150% of the product value');
      return;
    }

    onSave({
      ...formData,
      value: parseFloat(formData.value),
      current_price: parseFloat(formData.current_price),
      quantity: parseInt(formData.quantity),
      weight: parseFloat(formData.weight),
      dimensions: formData.dimensions
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderCategorySpecificFields = () => {
    switch (formData.category) {
      case 'book':
        return (
          <>
            <div>
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => updateField('author', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cover_type">Cover Type</Label>
              <Select value={formData.cover_type} onValueChange={(value) => updateField('cover_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cover type" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="paperback">Paperback</SelectItem>
                  <SelectItem value="hardcover">Hardcover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={formData.publisher}
                onChange={(e) => updateField('publisher', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="publication_date">Publication Date *</Label>
              <Input
                id="publication_date"
                type="date"
                value={formData.publication_date}
                onChange={(e) => updateField('publication_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="number_of_pages">Number of Pages</Label>
              <Input
                id="number_of_pages"
                type="number"
                value={formData.number_of_pages}
                onChange={(e) => updateField('number_of_pages', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => updateField('language', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => updateField('genre', e.target.value)}
              />
            </div>
          </>
        );
      case 'cd':
        return (
          <>
            <div>
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => updateField('artist', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="record_label">Record Label</Label>
              <Input
                id="record_label"
                value={formData.record_label}
                onChange={(e) => updateField('record_label', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tracklist">Tracklist</Label>
              <Textarea
                id="tracklist"
                value={formData.tracklist}
                onChange={(e) => updateField('tracklist', e.target.value)}
                placeholder="Enter track names, one per line"
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => updateField('genre', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="release_date">Release Date *</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => updateField('release_date', e.target.value)}
                required
              />
            </div>
          </>
        );
      case 'news':
        return (
          <>
            <div>
              <Label htmlFor="editor_in_chief">Editor-in-Chief *</Label>
              <Input
                id="editor_in_chief"
                value={formData.editor_in_chief}
                onChange={(e) => updateField('editor_in_chief', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={formData.publisher}
                onChange={(e) => updateField('publisher', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="issue_number">Issue Number</Label>
              <Input
                id="issue_number"
                value={formData.issue_number}
                onChange={(e) => updateField('issue_number', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="publication_frequency">Publication Frequency</Label>
              <Select value={formData.publication_frequency} onValueChange={(value) => updateField('publication_frequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="issn">ISSN</Label>
              <Input
                id="issn"
                value={formData.issn}
                onChange={(e) => updateField('issn', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => updateField('language', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sections">Sections</Label>
              <Textarea
                id="sections"
                value={formData.sections}
                onChange={(e) => updateField('sections', e.target.value)}
                placeholder="Enter sections (comma separated)"
              />
            </div>
            <div>
              <Label htmlFor="publication_date">Publication Date *</Label>
              <Input
                id="publication_date"
                type="date"
                value={formData.publication_date}
                onChange={(e) => updateField('publication_date', e.target.value)}
                required
              />
            </div>
          </>
        );
      case 'dvd':
        return (
          <>
            <div>
              <Label htmlFor="director">Director</Label>
              <Input
                id="director"
                value={formData.director}
                onChange={(e) => updateField('director', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="disc_type">Disc Type</Label>
              <Select value={formData.disc_type} onValueChange={(value) => updateField('disc_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disc type" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="blu-ray">Blu-ray</SelectItem>
                  <SelectItem value="hd-dvd">HD-DVD</SelectItem>
                  <SelectItem value="standard">Standard DVD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="runtime">Runtime (minutes)</Label>
              <Input
                id="runtime"
                type="number"
                value={formData.runtime}
                onChange={(e) => updateField('runtime', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="studio">Studio</Label>
              <Input
                id="studio"
                value={formData.studio}
                onChange={(e) => updateField('studio', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="subtitles">Subtitles</Label>
              <Input
                id="subtitles"
                value={formData.subtitles}
                onChange={(e) => updateField('subtitles', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => updateField('language', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="release_date">Release Date *</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => updateField('release_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => updateField('genre', e.target.value)}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{product ? 'Edit Product' : 'Add New Product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => updateField('category', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                  <SelectItem value="news">Newspaper</SelectItem>
                  <SelectItem value="dvd">DVD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="value">Value (excluding VAT) *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => updateField('value', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="current_price">Current Price (excluding VAT) *</Label>
              <Input
                id="current_price"
                type="number"
                step="0.01"
                value={formData.current_price}
                onChange={(e) => updateField('current_price', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => updateField('genre', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => updateField('weight', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensions (LxWxH cm) *</Label>
              <Input
                id="dimensions"
                placeholder="e.g., 20x15x5"
                value={formData.dimensions}
                onChange={(e) => updateField('dimensions', e.target.value)}
                required
              />
            </div>
          </div>

          {renderCategorySpecificFields()}

          <div className="flex space-x-4 pt-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {product ? 'Update Product' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

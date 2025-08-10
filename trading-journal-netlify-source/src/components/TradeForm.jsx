import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Zap, ImagePlus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { v4 as uuidv4 } from 'uuid';

export function TradeForm({ onSubmit, trade = null, onCancel }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    symbol: trade?.symbol || 'ES',
    status: trade?.status || 'win',
    pnl: trade?.pnl || '',
    date: trade?.date ? new Date(trade.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    strategy: trade?.strategy || '',
    notes: trade?.notes || '',
    image_urls: trade?.image_urls || [],
    rr: trade?.rr || '',
    followed_plan: trade?.followed_plan ?? true,
  });
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    if (formData.image_urls.length + files.length > 5) {
      toast({ title: "Upload Limit", description: "You can upload a maximum of 5 images.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${user.id}/${uuidv4()}`;
      const { data, error } = await supabase.storage.from('trade_images').upload(fileName, file);
      
      if (error) {
        console.error('Error uploading image:', error);
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('trade_images').getPublicUrl(data.path);
      uploadedUrls.push(publicUrl);
    }
    
    setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, ...uploadedUrls] }));
    setIsUploading(false);
  };

  const removeImage = (urlToRemove) => {
    setFormData(prev => ({...prev, image_urls: prev.image_urls.filter(url => url !== urlToRemove)}));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.symbol || formData.pnl === '' || !formData.date || !formData.strategy) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Symbol, PnL, Date, and Strategy.",
        variant: "destructive"
      });
      return;
    }

    const pnlValue = parseFloat(formData.pnl);
    const finalPnl = formData.status === 'win' ? Math.abs(pnlValue) : -Math.abs(pnlValue);

    const submissionData = {
        ...formData,
        pnl: finalPnl,
        rr: formData.rr === '' ? null : parseFloat(formData.rr),
    };
    
    delete submissionData.image_url;

    onSubmit(submissionData);

    toast({
      title: trade ? "Trade Updated" : "Trade Added",
      description: `Successfully ${trade ? 'updated' : 'added'} trade for ${formData.symbol}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="bg-card border">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              {trade ? 'Edit Trade Details' : 'Log a New Trade'}
            </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">Symbol</label>
                <Input
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  placeholder="e.g., ES, NQ, BTCUSD"
                  className="bg-secondary border text-secondary-foreground"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">W/L</label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-secondary border text-secondary-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">PnL ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.pnl}
                  onChange={(e) => setFormData(prev => ({ ...prev, pnl: e.target.value }))}
                  placeholder="250.50"
                  className="bg-secondary border text-secondary-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-secondary border text-secondary-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">Strategy</label>
                <Input
                  value={formData.strategy}
                  onChange={(e) => setFormData(prev => ({ ...prev, strategy: e.target.value }))}
                  placeholder="e.g., Supply/Demand Zone"
                  className="bg-secondary border text-secondary-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">Risk/Reward Ratio (R:R)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.rr}
                  onChange={(e) => setFormData(prev => ({ ...prev, rr: e.target.value }))}
                  placeholder="e.g., 2.5"
                  className="bg-secondary border text-secondary-foreground"
                />
              </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="followed-plan" 
                        checked={formData.followed_plan}
                        onCheckedChange={(checked) => setFormData(prev => ({...prev, followed_plan: checked}))}
                    />
                    <Label htmlFor="followed-plan" className="text-card-foreground text-base flex items-center">
                        {formData.followed_plan ? <CheckCircle className="mr-2 h-5 w-5 text-green-600" /> : <Circle className="mr-2 h-5 w-5 text-muted-foreground" />}
                        Did this trade follow your plan?
                    </Label>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Trade Screenshots</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                  {formData.image_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Trade screenshot ${index + 1}`} className="w-full h-32 object-cover rounded-lg border"/>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                         <Button type="button" variant="destructive" size="icon" className="h-8 w-8 bg-destructive hover:bg-destructive/90" onClick={() => removeImage(url)}>
                            <Trash2 className="h-4 w-4"/>
                         </Button>
                      </div>
                    </div>
                  ))}
                  {formData.image_urls.length < 5 && (
                    <div className="w-full h-32">
                      <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                          accept="image/*"
                          multiple
                          disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-full border-dashed border text-muted-foreground hover:border-primary hover:text-primary flex flex-col items-center justify-center"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading}
                      >
                        <ImagePlus className="h-8 w-8 mb-2" />
                        <span className="text-xs">Add Image(s)</span>
                      </Button>
                    </div>
                  )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Notes & Analysis</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="What went well? What could be improved? Confluence factors, emotions, etc."
                className="bg-secondary border text-secondary-foreground min-h-[150px]"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 text-base py-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                {trade ? 'Update Trade' : 'Save Trade'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 text-base py-6 border hover:bg-secondary text-card-foreground">
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

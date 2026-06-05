import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Si uuid n'est pas installé : npm install uuid && npm install @types/uuid
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

@Component({
  selector: 'app-ai-chat',
  standalone: false, // mettre true si standalone component
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss']
})
export class AiChatComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;

  messages: Message[] = [];
  userInput = '';
  isLoading = false;
  isOpen = false;
  sessionId = uuidv4();

  private readonly API_URL = 'http://localhost:8000/api/ai/chat';

  // Suggestions rapides affichées au démarrage
  quickSuggestions = [
    '📋 Voir les campagnes',
    '➕ Créer une campagne',
    '🔍 Vérifier campagne active',
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.messages.push({
      role: 'assistant',
      content: '👋 Bonjour ! Je suis votre assistant RH.\n\nJe peux vous aider à :\n• Vérifier les campagnes actives\n• Créer une nouvelle campagne\n• Activer ou clôturer une campagne\n\nQue souhaitez-vous faire ?',
      timestamp: new Date()
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.inputField?.nativeElement?.focus(), 100);
    }
  }

  sendMessage(): void {
    const msg = this.userInput.trim();
    if (!msg || this.isLoading) return;

    this.userInput = '';
    this.quickSuggestions = []; // Cacher les suggestions après le 1er message

    this.messages.push({
      role: 'user',
      content: msg,
      timestamp: new Date()
    });

    // Indicateur de frappe
    const typingMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    this.messages.push(typingMsg);
    this.isLoading = true;

    this.http.post<{ response: string; session_id: string }>(
      this.API_URL,
      { message: msg, session_id: this.sessionId }
    ).subscribe({
      next: (res) => {
        // Retirer l'indicateur de frappe
        this.messages = this.messages.filter(m => !m.isTyping);
        this.sessionId = res.session_id;
        this.messages.push({
          role: 'assistant',
          content: res.response,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: () => {
        this.messages = this.messages.filter(m => !m.isTyping);
        this.messages.push({
          role: 'assistant',
          content: '❌ Impossible de joindre l\'assistant. Vérifiez que le service Python est démarré sur le port 8000.',
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  useSuggestion(suggestion: string): void {
    this.userInput = suggestion.replace(/^[^\w]+/, '').trim();
    this.sendMessage();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearHistory(): void {
    this.sessionId = uuidv4();
    this.messages = [];
    this.ngOnInit();
    this.quickSuggestions = [
      '📋 Voir les campagnes',
      '➕ Créer une campagne',
      '🔍 Vérifier campagne active',
    ];
  }

  formatContent(content: string): string {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
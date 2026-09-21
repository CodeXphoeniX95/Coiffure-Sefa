import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, MessageCircle, Clock, Send, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { infosSalon as mockInfos } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { createMessage } from '../lib/api';
import './Contact.css';

export default function Contact() {
  const [form, setForm] = useState({ nom: '', telephone: '', sujet: '', message: '' });
  const [envoye, setEnvoye]  = useState(false);
  const [errors, setErrors]  = useState({});
  const toast = useToast();
  const { salonInfos, disponibilites } = useApp();
  const infos = salonInfos || mockInfos;

  const update = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const valider = () => {
    const errs = {};
    if (!form.nom.trim())      errs.nom      = 'Votre nom est requis.';
    if (!form.telephone.trim()) errs.telephone = 'Votre numéro est requis.';
    if (!form.message.trim())  errs.message  = 'Votre message est requis.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const envoyer = async (e) => {
    e.preventDefault();
    if (!valider()) return;

    const { error } = await createMessage(form);
    if (error) {
      toast.error('Erreur lors de l\'envoi. Réessayez.');
      return;
    }

    setEnvoye(true);
    toast.success('Message envoyé ! Nous vous répondrons très vite.');
    setForm({ nom: '', telephone: '', sujet: '', message: '' });
  };

  return (
    <div className="contact-page">
      <div className="page-header">
        <div className="container page-header__inner">
          <h1 className="page-header__titre">Nous <span>Contacter</span></h1>
          <p className="page-header__desc">
            Une question, une demande spéciale ? Nous sommes là pour vous répondre.
          </p>
          <div className="page-header__breadcrumb">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <span>Contact</span>
          </div>
        </div>
      </div>

      <div className="container contact-page__content">
        <div className="contact-page__layout">

          {/* Infos contact */}
          <div className="contact-infos">
            <div className="card contact-infos__card">
              <h3>Retrouvez-nous</h3>

              <div className="contact-info-item">
                <div className="contact-info-item__icon"><MapPin size={20} /></div>
                <div>
                  <strong>Adresse</strong>
                  <span>{infos.adresse}</span>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-item__icon"><Phone size={20} /></div>
                <div>
                  <strong>Téléphone</strong>
                  <a href={`tel:${infos.telephone}`}>{infos.telephone}</a>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-item__icon contact-info-item__icon--whatsapp">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <strong>WhatsApp</strong>
                  <a href={`https://wa.me/${infos.whatsapp || ''}`} target="_blank" rel="noopener noreferrer">
                    Écrire sur WhatsApp
                  </a>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-item__icon"><Mail size={20} /></div>
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${infos.email}`}>{infos.email}</a>
                </div>
              </div>
            </div>

            {/* Horaires */}
            <div className="card contact-horaires">
              <h3><Clock size={18} /> Horaires d'ouverture</h3>
              <ul className="contact-horaires__list">
                {disponibilites.map(d => (
                  <li key={d.id} className={!d.actif ? 'contact-horaires__item--ferme' : ''}>
                    <span>{d.jour}</span>
                    <strong>{d.actif ? `${d.heureDebut} – ${d.heureFin}` : 'Fermé'}</strong>
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp rapide */}
            <a
              href={`https://wa.me/${infos.whatsapp || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg contact-wa-btn"
            >
              <MessageCircle size={20} />
              Contacter sur WhatsApp
            </a>
          </div>

          {/* Formulaire */}
          <div className="card contact-form-card">
            {envoye ? (
              <div className="contact-success">
                <CheckCircle size={56} />
                <h3>Message envoyé !</h3>
                <p>Merci {form.nom || 'pour votre message'} ! Nous vous répondrons dans les plus brefs délais sur WhatsApp ou par téléphone.</p>
                <button className="btn btn-primary" onClick={() => setEnvoye(false)}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={envoyer} noValidate>
                <h3>Envoyez-nous un message</h3>

                <div className="grid-2" style={{ marginTop: '24px' }}>
                  <div className="form-group">
                    <label htmlFor="c-nom">Nom complet *</label>
                    <input type="text" id="c-nom" placeholder="Votre nom"
                      value={form.nom} onChange={e => update('nom', e.target.value)} />
                    {errors.nom && <p className="form-error">{errors.nom}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="c-tel">Téléphone *</label>
                    <input type="tel" id="c-tel" placeholder="+228 90 00 00 00"
                      value={form.telephone} onChange={e => update('telephone', e.target.value)} />
                    {errors.telephone && <p className="form-error">{errors.telephone}</p>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="c-sujet">Sujet</label>
                  <select id="c-sujet" value={form.sujet} onChange={e => update('sujet', e.target.value)}>
                    <option value="">Choisir un sujet</option>
                    <option value="rdv">Prise de rendez-vous</option>
                    <option value="tarifs">Renseignement sur les tarifs</option>
                    <option value="paiement">Problème de paiement</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="c-msg">Message *</label>
                  <textarea id="c-msg" rows={5} placeholder="Décrivez votre demande..."
                    value={form.message} onChange={e => update('message', e.target.value)} />
                  {errors.message && <p className="form-error">{errors.message}</p>}
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={18} /> Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
